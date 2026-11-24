// Gets the code: fresh clone, or update an existing installation.
import fs from 'node:fs';
import path from 'node:path';
import {run} from '../commands.mjs';
import {DEFAULT_BRANCH, REPOSITORY_URL} from '../constants.mjs';

export function isExistingInstallation(directory) {
  return fs.existsSync(path.join(directory, '.git')) && fs.existsSync(path.join(directory, 'package.json'));
}

/** Throws before anything is downloaded if the folder holds something else. */
export function checkTargetFolder(directory) {
  if (!isExistingInstallation(directory) && fs.existsSync(directory) && fs.readdirSync(directory).length > 0) {
    throw new Error(`The folder ${directory} is not empty and not a Terraforming Mars installation.`);
  }
}

export async function fetchSource({directory, log}) {
  if (isExistingInstallation(directory)) {
    // --ff-only: never overwrite local changes silently; rather stop with a clear message
    await run('git', ['pull', '--ff-only'], {cwd: directory, log});
    return;
  }
  await run('git', ['clone', '--branch', DEFAULT_BRANCH, '--depth', '1', REPOSITORY_URL, directory], {log});
}
