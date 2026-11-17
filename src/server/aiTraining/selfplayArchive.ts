import * as fs from 'fs';
import * as path from 'path';
import {GameId, SpectatorId} from '../../common/Types';
import {SelfplayArchiveKind, SelfplayArchiveRef, selfplayArchivePath} from '../../common/aiTraining/selfplayArchive';
import type {GameKeeper} from './AiTrainingGames';
import {importAiTrainingGame} from './importAiTrainingGame';

// Archived self-play games of the new AI (kept by the training hub): the first visit of a result page imports the
// game as a finished game of this server; afterwards the same game is opened again. The decision log stays on the
// hub and is fetched for admins when they open it, so this server keeps only which game came from where.

/** Imported archive game: where it came from and its ids on this server */
export type ImportedSelfplayGame = SelfplayArchiveRef & {
  localGameId: GameId;
  spectatorId: SpectatorId;
};

export type SelfplayArchiveStorage = {
  load(): Array<ImportedSelfplayGame>;
  save(games: ReadonlyArray<ImportedSelfplayGame>): void;
};

export function selfplayArchiveFile(): string {
  return process.env.AI_TRAINING_ARCHIVE_FILE ?? path.resolve('db', 'ai-training-archive.json');
}

export function fileSelfplayStorage(file: string = selfplayArchiveFile()): SelfplayArchiveStorage {
  return {
    load() {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        return Array.isArray(data) ? data : [];
      } catch {
        // No file yet: no archive game opened so far
        return [];
      }
    },
    save(games) {
      fs.mkdirSync(path.dirname(file), {recursive: true});
      const temporary = file + '.tmp';
      fs.writeFileSync(temporary, JSON.stringify(games, null, 2));
      fs.renameSync(temporary, file);
    },
  };
}

/** Reads the hub; undefined: this server has no hub (AI_TRAINING_FEED empty) */
export type SelfplayArchiveSource = (kind: SelfplayArchiveKind, ref: SelfplayArchiveRef) => Promise<string>;

// A record is a few hundred kilobytes: more time than for the lobby feed
const TIMEOUT_MS = 20000;

export function configuredArchiveSource(): SelfplayArchiveSource | undefined {
  const feed = process.env.AI_TRAINING_FEED?.trim();
  if (!feed) {
    return undefined;
  }
  return async (kind, ref) => {
    const url = new URL(selfplayArchivePath(kind, ref), feed).toString();
    const response = await fetch(url, {signal: AbortSignal.timeout(TIMEOUT_MS)});
    if (!response.ok) {
      throw new Error(`${url}: HTTP ${response.status}`);
    }
    return response.text();
  };
}

const sameRef = (a: SelfplayArchiveRef, b: SelfplayArchiveRef) => a.machine === b.machine && a.gameId === b.gameId;

export class SelfplayArchive {
  private static instance: SelfplayArchive | undefined;
  public static getInstance(): SelfplayArchive {
    this.instance ??= new SelfplayArchive();
    return this.instance;
  }

  private games: Array<ImportedSelfplayGame> | undefined;
  // Two visitors opening the same new game at once must not import it twice
  private readonly opening = new Map<string, Promise<SpectatorId>>();

  constructor(
    private readonly source: SelfplayArchiveSource | undefined = configuredArchiveSource(),
    private readonly storage: SelfplayArchiveStorage = fileSelfplayStorage()) {}

  private imported(): Array<ImportedSelfplayGame> {
    this.games ??= this.storage.load();
    return this.games;
  }

  public get available(): boolean {
    return this.source !== undefined;
  }

  /** Spectator id of the archived game on this server; imports it on first use */
  public open(ref: SelfplayArchiveRef, keeper: GameKeeper): Promise<SpectatorId> {
    const key = `${ref.machine}/${ref.gameId}`;
    let pending = this.opening.get(key);
    if (pending === undefined) {
      pending = this.openOrImport(ref, keeper).finally(() => this.opening.delete(key));
      this.opening.set(key, pending);
    }
    return pending;
  }

  private async openOrImport(ref: SelfplayArchiveRef, keeper: GameKeeper): Promise<SpectatorId> {
    const known = this.imported().find((game) => sameRef(game, ref));
    // The lobby removes its older games: then the game is imported again
    if (known !== undefined && (keeper.load === undefined || await keeper.load(known.localGameId).catch(() => undefined) !== undefined)) {
      return known.spectatorId;
    }
    return this.importGame(ref, keeper);
  }

  private async importGame(ref: SelfplayArchiveRef, keeper: GameKeeper): Promise<SpectatorId> {
    if (this.source === undefined) {
      throw new Error('This server has no training hub (AI_TRAINING_FEED)');
    }
    const game = importAiTrainingGame(await this.source('game', ref), `AI-Training Rust ${ref.gameId}`, 'normal', undefined);
    await keeper.keep(game);
    // The import always gives one (importAiTrainingGame)
    const spectatorId = game.spectatorId as SpectatorId;
    this.remember(ref, game.id, spectatorId);
    return spectatorId;
  }

  /** Also for the games the lobby imports itself (AiTrainingGames), so they get their decision log too */
  public remember(ref: SelfplayArchiveRef, localGameId: GameId, spectatorId: SpectatorId): void {
    const games = this.imported().filter((game) => !sameRef(game, ref));
    games.push({...ref, localGameId, spectatorId});
    this.games = games;
    this.storage.save(games);
  }

  /** Where a game of this server came from; undefined: no archived self-play game */
  public refOf(localGameId: GameId): SelfplayArchiveRef | undefined {
    const game = this.imported().find((candidate) => candidate.localGameId === localGameId);
    return game === undefined ? undefined : {machine: game.machine, gameId: game.gameId};
  }

  /** Decision log of the game as JSON text (the record line of the training data) */
  public record(ref: SelfplayArchiveRef): Promise<string> {
    if (this.source === undefined) {
      return Promise.reject(new Error('This server has no training hub (AI_TRAINING_FEED)'));
    }
    return this.source('record', ref);
  }
}
