import * as fs from 'fs';
import * as path from 'path';
import {AiFeedbackEntry, AiFeedbackRecord} from '../../common/ai/AiFeedback';

// Ratings of AI decisions in analysis games: one JSONL file per game (<directory>/<gameId>.jsonl),
// only ever appended to – simultaneous ratings lose nothing and every change stays traceable.
// Kept beside the game, not in it: a rating is no move and must not change the save chain (undo).
// Directory: AI_FEEDBACK_DIR, by default db/ai-feedback (the db folder is the persistent volume).
// These files are training data: no clean-up job may delete or shorten them.

const DEFAULT_DIRECTORY = path.resolve(process.cwd(), 'db', 'ai-feedback');

/** Per decision (or line without decision) and rater, the last line counts. */
function ratingKey(record: AiFeedbackRecord): string {
  return `${record.decisionId ?? 'line:' + record.messageId}|${record.rater.playerId}`;
}

export class AiFeedbackStore {
  private static instance: AiFeedbackStore | undefined;
  private readonly cache = new Map<string, Array<AiFeedbackRecord>>();

  public constructor(private readonly directory: string = process.env.AI_FEEDBACK_DIR ?? DEFAULT_DIRECTORY) {}

  public static getInstance(): AiFeedbackStore {
    AiFeedbackStore.instance ??= new AiFeedbackStore();
    return AiFeedbackStore.instance;
  }

  /** Tests: the server routes then write into this store (e.g. a temporary directory). */
  public static replaceInstance(store: AiFeedbackStore | undefined): void {
    AiFeedbackStore.instance = store;
  }

  public fileOf(gameId: string): string {
    // Game ids come from the server itself, but a path separator must never reach the file system
    return path.join(this.directory, `${gameId.replace(/[^A-Za-z0-9_-]/g, '_')}.jsonl`);
  }

  /** Every line of the game's file, oldest first. */
  public records(gameId: string): ReadonlyArray<AiFeedbackRecord> {
    let records = this.cache.get(gameId);
    if (records === undefined) {
      records = this.read(gameId);
      this.cache.set(gameId, records);
    }
    return records;
  }

  private read(gameId: string): Array<AiFeedbackRecord> {
    try {
      return fs.readFileSync(this.fileOf(gameId), 'utf8').split('\n').filter((line) => line.trim() !== '').flatMap((line) => {
        try {
          return [JSON.parse(line) as AiFeedbackRecord];
        } catch {
          // A broken line (e.g. disk full while writing) must not hide the others
          return [];
        }
      });
    } catch {
      // No ratings yet: the game simply has none
      return [];
    }
  }

  /** Appends one line (rating, change or retraction). */
  public append(record: AiFeedbackRecord): void {
    this.records(record.gameId);
    this.cache.get(record.gameId)?.push(record);
    try {
      fs.mkdirSync(this.directory, {recursive: true});
      fs.appendFileSync(this.fileOf(record.gameId), JSON.stringify(record) + '\n');
    } catch (error) {
      // The rating stays in memory; losing it on restart is better than breaking the game
      console.error(`Could not save AI rating of game ${record.gameId}`, error);
    }
  }

  /** Current ratings: the last line per decision and rater, without retracted ones. */
  public current(gameId: string): Array<AiFeedbackRecord> {
    const latest = new Map<string, AiFeedbackRecord>();
    for (const record of this.records(gameId)) {
      latest.set(ratingKey(record), record);
    }
    return [...latest.values()].filter((record) => record.retracted !== true && record.rating !== undefined);
  }

  /** Current ratings as the players see them (no player ids). */
  public entries(gameId: string): Array<AiFeedbackEntry> {
    return this.current(gameId).flatMap((record) => record.rating === undefined ? [] : [{
      messageId: record.messageId,
      decisionId: record.decisionId,
      color: record.rater.color,
      name: record.rater.name,
      rating: record.rating,
      text: record.text,
      betterOptionIndex: record.betterOptionIndex,
      betterOptionLabel: record.betterOptionLabel,
      betterOptionCard: record.betterOptionCard,
      at: record.at,
    }]);
  }
}
