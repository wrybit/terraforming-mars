import * as fs from 'fs';
import * as path from 'path';
import {RustFallback, RustFallbackSummary} from '../../../common/admin/RustFallback';
import {RUST_BOT_EVENTS} from './rustBotPaths';
import {PlayerInput} from '../../PlayerInput';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
// Older entries only fill the file: the dashboard looks at one day
const KEEP_MILLISECONDS = 7 * DAY_MILLISECONDS;
const RECENT_COUNT = 10;

/**
 * Record of the Rust AI's fallbacks, one JSON line each in a file next to the bot's event files.
 *
 * Survives server restarts; read once on first use, written on every fallback.
 */
export class RustFallbackLog {
  private entries: Array<RustFallback> | undefined = undefined;

  constructor(private readonly file: string, private readonly clock: () => number = Date.now) {}

  /** Keeps one fallback and writes it to the server log too. */
  public record(entry: Omit<RustFallback, 'timeMs'>): void {
    const full: RustFallback = {timeMs: this.clock(), ...entry};
    console.warn(`Rust AI fallback in game ${full.gameId}, generation ${full.generation}, ${full.decision}: ${full.reason}; the TypeScript AI decides`);
    const entries = this.read();
    entries.push(full);
    const kept = entries.filter((stored) => full.timeMs - stored.timeMs <= KEEP_MILLISECONDS);
    this.entries = kept;
    try {
      fs.mkdirSync(path.dirname(this.file), {recursive: true});
      if (kept.length === entries.length) {
        fs.appendFileSync(this.file, JSON.stringify(full) + '\n');
      } else {
        fs.writeFileSync(this.file, kept.map((stored) => JSON.stringify(stored)).join('\n') + '\n');
      }
    } catch (error) {
      console.warn(`Rust AI fallbacks cannot be written to ${this.file}: ${(error as Error).message}`);
    }
  }

  /** Count of the last 24 hours and the newest entries. */
  public summary(): RustFallbackSummary {
    const now = this.clock();
    const entries = this.read();
    return {
      last24h: entries.filter((entry) => now - entry.timeMs <= DAY_MILLISECONDS).length,
      recent: entries.slice(-RECENT_COUNT).reverse(),
    };
  }

  private read(): Array<RustFallback> {
    if (this.entries === undefined) {
      try {
        this.entries = fs.readFileSync(this.file, 'utf8').split('\n').filter((line) => line !== '').map((line) => JSON.parse(line) as RustFallback);
      } catch {
        this.entries = [];
      }
    }
    return this.entries;
  }
}

/** The record of this server. */
export const rustFallbackLog = new RustFallbackLog(path.join(RUST_BOT_EVENTS, 'fallbacks.jsonl'));

/** Kind of a decision for the record, e.g. "or: Take your first action". */
export function decisionLabel(input: PlayerInput): string {
  const title = typeof input.title === 'string' ? input.title : input.title.message;
  return title === '' ? input.type : input.type + ': ' + title;
}
