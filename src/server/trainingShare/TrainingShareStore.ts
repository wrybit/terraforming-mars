import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export type TrainingShareState = {
  /** Secret of this server: identifies it at the receiver and keys the pseudonyms of the ids. Never shown whole. */
  serverKey: string,
  /** Real game id → when it was shared (the receiver keeps the first copy, a second upload would be wasted) */
  shared: Record<string, number>,
  /** Finished games waiting for an (automatic) upload, with the number of failed tries */
  pending: Record<string, number>,
  lastError?: {gameId: string, message: string, atMs: number},
};

/** db/training-share.json: the db folder is the persistent one (Docker volume). */
export class TrainingShareStore {
  public constructor(private readonly file: string = process.env.TRAINING_SHARE_FILE ?? path.resolve(process.cwd(), 'db', 'training-share.json')) {}

  public exists(): boolean {
    return fs.existsSync(this.file);
  }

  public read(): TrainingShareState {
    try {
      const state = JSON.parse(fs.readFileSync(this.file, 'utf8')) as Partial<TrainingShareState>;
      if (typeof state.serverKey === 'string' && /^[0-9a-f]{64}$/.test(state.serverKey)) {
        return {serverKey: state.serverKey, shared: state.shared ?? {}, pending: state.pending ?? {}, lastError: state.lastError};
      }
    } catch {
      // No file yet (first share) or a broken one: start fresh, a new key only costs the receiver's tie to the old one
    }
    const fresh: TrainingShareState = {serverKey: crypto.randomBytes(32).toString('hex'), shared: {}, pending: {}};
    this.write(fresh);
    return fresh;
  }

  public write(state: TrainingShareState): void {
    fs.mkdirSync(path.dirname(this.file), {recursive: true});
    // Write and rename: a crash in the middle must not destroy the key
    const partial = this.file + '.partial';
    fs.writeFileSync(partial, JSON.stringify(state, null, 2), {mode: 0o600});
    fs.renameSync(partial, this.file);
  }

  public update(change: (state: TrainingShareState) => void): TrainingShareState {
    const state = this.read();
    change(state);
    this.write(state);
    return state;
  }
}
