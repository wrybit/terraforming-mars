import * as fs from 'fs';
import * as path from 'path';

// An update script announces a restart by creating this file (e.g. `docker exec ... touch`), waits a
// few seconds and then replaces the server. Meanwhile inputs are refused and open pages show a notice,
// so no move gets lost in the switch. The new server removes the file when it starts.
function updateFlagFile(): string {
  return process.env.SERVER_UPDATE_FLAG_FILE ?? path.resolve('db', 'server-update.flag');
}

/** Start time of this process: open pages compare it to notice that a new server is running. */
export const serverStartedAt = Date.now();

export function isServerUpdating(): boolean {
  return fs.existsSync(updateFlagFile());
}

export function clearServerUpdateFlag(): void {
  fs.rmSync(updateFlagFile(), {force: true});
}
