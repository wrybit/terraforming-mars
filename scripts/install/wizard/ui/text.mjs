// Width of text as it appears in the terminal: escape codes take no space.

import os from 'node:os';

const ESCAPE_CODES = /\x1b\[[0-9;?]*[A-Za-z]/g;

export function visibleLength(text) {
  return [...String(text).replace(ESCAPE_CODES, '')].length;
}

/** Pads with spaces to `width` visible characters (never cuts). */
export function padVisible(text, width) {
  return text + ' '.repeat(Math.max(0, width - visibleLength(text)));
}

export function terminalColumns() {
  return process.stdout.columns || 80;
}

/** Shortens long text in the middle (…), so paths keep their start and their end. */
export function shortenMiddle(text, maximum) {
  const characters = [...String(text)];
  if (characters.length <= maximum) {
    return String(text);
  }
  const keep = maximum - 1;
  return `${characters.slice(0, Math.ceil(keep / 2)).join('')}…${characters.slice(-Math.floor(keep / 2)).join('')}`;
}

/** Path with ~ for the home folder, as people type it. */
export function homeRelative(directory) {
  const home = os.homedir();
  return directory === home || directory.startsWith(`${home}/`) || directory.startsWith(`${home}\\`) ? `~${directory.slice(home.length)}` : directory;
}
