import * as fs from 'fs';
import {EMPTY_RUST_AI_SUPPORT, RustAiSupport, parseRustAiSupport} from '../../../common/ai/RustAiSupport';
import {RUST_AI_SUPPORT_FILE} from './rustBotPaths';

/**
 * Reader of the support file next to the Rust bot (common/ai/RustAiSupport.ts).
 *
 * Reads again whenever the file's modification time changes, so a bot deploy needs no server restart. A missing or
 * broken file means the new AI plays nothing. Unknown IDs are logged once per file path and ID.
 */
export class RustAiSupportFile {
  private mtimeMs: number | undefined = undefined;
  private support: RustAiSupport = EMPTY_RUST_AI_SUPPORT;
  private readonly loggedUnknownIds = new Set<string>();

  constructor(private readonly file: string) {}

  /** Current support; reads the file only when it changed since the last call. */
  public get(): RustAiSupport {
    let mtimeMs: number | undefined;
    try {
      mtimeMs = fs.statSync(this.file).mtimeMs;
    } catch {
      mtimeMs = undefined;
    }
    if (mtimeMs === this.mtimeMs) {
      return this.support;
    }
    this.mtimeMs = mtimeMs;
    this.support = mtimeMs === undefined ? EMPTY_RUST_AI_SUPPORT : this.read();
    return this.support;
  }

  private read(): RustAiSupport {
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch (error) {
      console.warn(`Rust AI support file ${this.file} is unreadable (${(error as Error).message}); the new AI plays nothing`);
      return EMPTY_RUST_AI_SUPPORT;
    }
    const {support, unknownIds} = parseRustAiSupport(raw);
    const newUnknownIds = unknownIds.filter((id) => !this.loggedUnknownIds.has(id));
    if (newUnknownIds.length > 0) {
      newUnknownIds.forEach((id) => this.loggedUnknownIds.add(id));
      console.warn(`Rust AI support file ${this.file} names unknown IDs, ignored: ${newUnknownIds.join(', ')}`);
    }
    return support;
  }
}

/** The file of this server's Rust bot. */
export const rustAiSupportFile = new RustAiSupportFile(RUST_AI_SUPPORT_FILE);
