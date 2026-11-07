import {AI_TRAINING_FINISHED_GAMES, AiTrainingFeed, AiTrainingFeedGame, AiTrainingFinishedGame, aiTrainingTitle} from '../../common/lobby/AiTrainingFeed';
import {LobbyRoomModel, LobbySetupModel} from '../../common/lobby/LobbyModel';
import {IGameLoader} from '../database/IGameLoader';
import {Database} from '../database/Database';
import {IGame} from '../IGame';
import {Game} from '../Game';
import {GameOptions} from '../game/GameOptions';
import {AiTrainingFeedSource, configuredFeedSource} from './aiTrainingFeedSource';
import {AiTrainingStorage, StoredAiTrainingGame, fileTrainingStorage} from './aiTrainingStore';
import {aiTrainingSetup} from './aiTrainingSetup';
import {importAiTrainingGame} from './importAiTrainingGame';

// The lobby polls every 2.5 s; the coordinator is asked at most this often
const FEED_MAX_AGE_MS = 5000;

/** Stores an imported game like a finished game of this server */
export type GameKeeper = {
  keep(game: IGame): Promise<void>;
  remove(gameId: StoredAiTrainingGame['gameId']): Promise<void>;
};

export function databaseKeeper(gameLoader: IGameLoader): GameKeeper {
  return {
    keep: async (game) => {
      await gameLoader.add(game);
      await gameLoader.saveGame(game);
      await Database.getInstance().markFinished(game.id);
    },
    remove: (gameId) => gameLoader.deleteGame(gameId, 'replaced-ai-training'),
  };
}

const feedKey = (feed: AiTrainingFeed, game: {index: number}) => `${feed.batch.id}/${game.index}`;

/**
 * AI test batch games of this server's own computer for the lobby: the running ones as information, the last
 * AI_TRAINING_FINISHED_GAMES finished ones imported as games of this server, so they can be watched afterwards.
 */
export class AiTrainingGames {
  private feed: AiTrainingFeed | undefined;
  private fetchedAt = -Infinity;
  private refreshing: Promise<void> | undefined;
  private stored: Array<StoredAiTrainingGame> | undefined;

  constructor(
    private readonly source: AiTrainingFeedSource | undefined = configuredFeedSource(),
    private readonly storage: AiTrainingStorage = fileTrainingStorage(),
    private readonly clock: () => number = Date.now,
  ) {}

  /** Rows for the lobby list: running games first, then the finished ones, newest first */
  public async rooms(keeper: GameKeeper): Promise<Array<LobbyRoomModel>> {
    if (this.source === undefined) {
      return [];
    }
    if (this.clock() - this.fetchedAt >= FEED_MAX_AGE_MS) {
      this.refreshing ??= this.refresh(this.source, keeper).finally(() => this.refreshing = undefined);
      await this.refreshing;
    }
    const live = (this.feed?.live ?? []).map((game) => this.liveRoom(this.feed as AiTrainingFeed, game));
    const finished = [...this.games()].sort((a, b) => b.finishedAt - a.finishedAt).map((game) => this.finishedRoom(game));
    return [...live, ...finished];
  }

  private games(): Array<StoredAiTrainingGame> {
    this.stored ??= this.storage.load();
    return this.stored;
  }

  private async refresh(source: AiTrainingFeedSource, keeper: GameKeeper): Promise<void> {
    this.fetchedAt = this.clock();
    let feed: AiTrainingFeed;
    try {
      feed = await source.feed();
    } catch {
      // Coordinator off (no batch running, computer asleep): no running games, the finished ones stay
      this.feed = undefined;
      return;
    }
    this.feed = feed;
    const known = new Set(this.games().map((game) => game.key));
    const newest = this.games().reduce((latest, game) => Math.max(latest, game.finishedAt), -Infinity);
    for (const game of feed.finished.filter((candidate) => !known.has(feedKey(feed, candidate)) && candidate.finishedAt > newest)) {
      try {
        await this.importGame(source, keeper, feed, game);
      } catch (error) {
        console.error(`Could not import AI training game ${feedKey(feed, game)}`, error);
      }
    }
  }

  private async importGame(source: AiTrainingFeedSource, keeper: GameKeeper, feed: AiTrainingFeed, finished: AiTrainingFinishedGame): Promise<void> {
    const title = aiTrainingTitle(feed.batch.commit, finished.variants, finished.number);
    const game = importAiTrainingGame(await source.game(finished.gamePath), title, finished.level, finished.variants);
    await keeper.keep(game);
    const games = this.games();
    games.push({
      key: feedKey(feed, finished),
      number: finished.number,
      title,
      gameId: game.id,
      // The import always gives one (importAiTrainingGame)
      spectatorId: game.spectatorId as StoredAiTrainingGame['spectatorId'],
      finishedAt: finished.finishedAt,
      playerCount: game.players.length,
      level: finished.level,
      generation: game.generation,
      elapsedMs: finished.elapsedMs,
      setup: aiTrainingSetup(game.gameOptions),
    });
    games.sort((a, b) => a.finishedAt - b.finishedAt);
    const replaced = games.splice(0, Math.max(0, games.length - AI_TRAINING_FINISHED_GAMES));
    this.storage.save(games);
    for (const old of replaced) {
      await keeper.remove(old.gameId).catch((error) => console.error(`Could not remove AI training game ${old.gameId}`, error));
    }
  }

  private liveRoom(feed: AiTrainingFeed, game: AiTrainingFeedGame): LobbyRoomModel {
    return this.room(`ai-training-${feedKey(feed, game).replace(/\W/g, '-')}`, aiTrainingTitle(feed.batch.commit, game.variants),
      game.playerCount, game.level, aiTrainingSetup(Game.resolveOptions({...game.gameOptions} as Partial<GameOptions>)), false, game.generation, game.terraforming, game.elapsedMs);
  }

  private finishedRoom(game: StoredAiTrainingGame): LobbyRoomModel {
    return {
      ...this.room(`ai-training-${game.number}`, game.title, game.playerCount, game.level, game.setup, true, game.generation, 1, game.elapsedMs),
      spectatorId: game.spectatorId,
      ageMs: this.clock() - game.finishedAt,
    };
  }

  private room(id: string, title: string, playerCount: number, level: StoredAiTrainingGame['level'], setup: LobbySetupModel,
    finished: boolean, generation: number, terraforming: number, playedMs: number): LobbyRoomModel {
    return {
      id,
      title,
      ageMs: 0,
      state: 'started',
      listed: true,
      seats: Array.from({length: playerCount}, () => ({kind: 'ai', aiLevel: level})),
      setup,
      progress: {generation, terraforming, playedMs},
      aiTraining: {finished},
    };
  }
}
