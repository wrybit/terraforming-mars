import * as fs from 'fs';
import * as path from 'path';
import {GameId} from '../../common/Types';
import {AiFeedbackEntry} from '../../common/ai/AiFeedback';

// Ratings of AI decisions in analysis games, one JSON file per game (<directory>/<gameId>.json).
// Kept beside the game, not in it: a rating is no move, must not change the save chain (undo)
// and stays readable for the evaluation of the AI without loading the game.
// Directory: AI_FEEDBACK_DIR, by default db/ai-feedback (the db folder is the persistent volume).

const DEFAULT_DIRECTORY = path.resolve(process.cwd(), 'db', 'ai-feedback');

export class AiFeedbackStore {
  private static instance: AiFeedbackStore | undefined;
  private readonly cache = new Map<GameId, Array<AiFeedbackEntry>>();

  public constructor(private readonly directory: string = process.env.AI_FEEDBACK_DIR ?? DEFAULT_DIRECTORY) {}

  public static getInstance(): AiFeedbackStore {
    AiFeedbackStore.instance ??= new AiFeedbackStore();
    return AiFeedbackStore.instance;
  }

  private fileOf(gameId: GameId): string {
    // Game ids come from the server itself, but a path separator must never reach the file system
    return path.join(this.directory, `${gameId.replace(/[^A-Za-z0-9_-]/g, '_')}.json`);
  }

  public get(gameId: GameId): ReadonlyArray<AiFeedbackEntry> {
    let entries = this.cache.get(gameId);
    if (entries === undefined) {
      entries = this.read(gameId);
      this.cache.set(gameId, entries);
    }
    return entries;
  }

  private read(gameId: GameId): Array<AiFeedbackEntry> {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(this.fileOf(gameId), 'utf8'));
      return Array.isArray(parsed) ? parsed as Array<AiFeedbackEntry> : [];
    } catch {
      // No ratings yet (or an unreadable file): the game simply has none
      return [];
    }
  }

  /** Sets the player's rating of the line (one per player and line); undefined removes it. */
  public set(gameId: GameId, messageId: string, color: string, entry: AiFeedbackEntry | undefined): void {
    const others = this.get(gameId).filter((existing) => existing.messageId !== messageId || existing.color !== color);
    const entries = entry === undefined ? others : [...others, entry];
    this.cache.set(gameId, entries);
    try {
      fs.mkdirSync(this.directory, {recursive: true});
      fs.writeFileSync(this.fileOf(gameId), JSON.stringify(entries, null, 1));
    } catch (error) {
      // The rating stays in memory; losing it on restart is better than breaking the game
      console.error(`Could not save AI ratings of game ${gameId}`, error);
    }
  }
}
