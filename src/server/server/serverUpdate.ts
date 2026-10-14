import * as fs from 'fs';
import * as path from 'path';
import {ServerUpdateCommit} from '../../common/models/ServerStatusModel';

// An update script announces a restart by creating this file (e.g. `docker exec ... touch`), waits a
// few seconds and then replaces the server. Meanwhile inputs are refused and open pages show a notice,
// so no move gets lost in the switch. The new server removes the file when it starts.
// The file may list the commits of the update, one per line as "<short hash><TAB><subject>" (newest first);
// open pages show them in the notice. An empty file (admin restart, older scripts) shows no list.
function updateFlagFile(): string {
  return process.env.SERVER_UPDATE_FLAG_FILE ?? path.resolve('db', 'server-update.flag');
}

/** Start time of this process: open pages compare it to notice that a new server is running. */
export const serverStartedAt = Date.now();

// More would not help in the small notice box and only bloats every status answer
const MAX_COMMITS = 50;

/** Commits the last update brought in: read from the flag when this server starts. */
let installedCommits: ReadonlyArray<ServerUpdateCommit> = [];

function parseCommits(content: string): ReadonlyArray<ServerUpdateCommit> {
  const commits: Array<ServerUpdateCommit> = [];
  for (const line of content.split('\n')) {
    const tab = line.indexOf('\t');
    const hash = (tab < 0 ? '' : line.slice(0, tab)).trim();
    const subject = line.slice(tab + 1).trim();
    if (hash !== '' && subject !== '') {
      commits.push({hash, subject});
    }
    if (commits.length === MAX_COMMITS) {
      break;
    }
  }
  return commits;
}

function readFlagCommits(): ReadonlyArray<ServerUpdateCommit> {
  try {
    return parseCommits(fs.readFileSync(updateFlagFile(), 'utf8'));
  } catch {
    // No flag (or unreadable): no list
    return [];
  }
}

/** While updating: the commits about to be installed; otherwise the ones this server brought in. */
export function serverUpdateCommits(): ReadonlyArray<ServerUpdateCommit> {
  return isServerUpdating() ? readFlagCommits() : installedCommits;
}

export function isServerUpdating(): boolean {
  return fs.existsSync(updateFlagFile());
}

/** Announces a restart from inside the server (admin page): same notice for open pages as an update script. */
export function markServerUpdating(): void {
  fs.mkdirSync(path.dirname(updateFlagFile()), {recursive: true});
  fs.writeFileSync(updateFlagFile(), '');
}

export function clearServerUpdateFlag(): void {
  // Pages that saw the announcement keep their list; pages that missed it get it from the new server
  installedCommits = readFlagCommits();
  fs.rmSync(updateFlagFile(), {force: true});
}
