import * as fs from 'fs';
import * as path from 'path';

/** Unpacked new package inside the bot folder (same disk, so the swap is a rename) */
export const UPDATE_FOLDER = '.update';
/** The replaced version, kept until the next update: copying it back undoes an update */
export const PREVIOUS_FOLDER = '.previous';

function entries(folder: string): Array<string> {
  return fs.readdirSync(folder).filter((name) => name !== UPDATE_FOLDER && name !== PREVIOUS_FOLDER);
}

/**
 * Puts the unpacked package (folder/.update) in place of the bot folder's contents and keeps the old ones in
 * folder/.previous. Works inside the folder instead of renaming it, because in Docker the folder itself is the mount.
 * Only renames: a running bot keeps its program (Linux, macOS; Windows allows renaming a running .exe), new games
 * start the new one. An old data folder moves away too, so the new bot uses the data built into it.
 * If a rename fails halfway, the old contents come back.
 */
export function swapInUpdate(folder: string): void {
  const update = path.join(folder, UPDATE_FOLDER);
  const previous = path.join(folder, PREVIOUS_FOLDER);
  fs.rmSync(previous, {recursive: true, force: true});
  fs.mkdirSync(previous);
  const old = entries(folder);
  const moved: Array<string> = [];
  const placed: Array<string> = [];
  try {
    for (const name of old) {
      fs.renameSync(path.join(folder, name), path.join(previous, name));
      moved.push(name);
    }
    for (const name of fs.readdirSync(update)) {
      fs.renameSync(path.join(update, name), path.join(folder, name));
      placed.push(name);
    }
  } catch (error) {
    for (const name of placed) {
      fs.rmSync(path.join(folder, name), {recursive: true, force: true});
    }
    for (const name of moved) {
      fs.renameSync(path.join(previous, name), path.join(folder, name));
    }
    throw error;
  }
  fs.rmSync(update, {recursive: true, force: true});
}
