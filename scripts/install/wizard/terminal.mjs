// Terminal basics for the wizard: key presses, cursor, redrawing.
// No dependencies on purpose, because the wizard runs before `npm ci`.
import readline from 'node:readline';

export function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export function write(text) {
  process.stdout.write(text);
}

export function writeLine(text = '') {
  process.stdout.write(`${text}\n`);
}

export function writeLines(lines) {
  process.stdout.write(`${lines.join('\n')}\n`);
}

/** Clears the last `lineCount` lines so a menu is redrawn in the same place. */
export function clearLines(lineCount) {
  if (lineCount > 0) {
    write(`\x1b[${lineCount}A\x1b[0J`);
  }
}

/** Empties the screen and its scrollback, so the installer always starts at the top. */
export function clearScreen() {
  if (isInteractive()) {
    write('\x1b[2J\x1b[3J\x1b[H');
  }
}

export function hideCursor() {
  write('\x1b[?25l');
}

export function showCursor() {
  write('\x1b[?25h');
}

let keypressReady = false;

/**
 * Reads keys in raw mode until `onKey` returns true.
 * Ctrl+C ends the wizard cleanly; otherwise the terminal would stay in raw mode.
 */
export function readKeys(onKey) {
  if (!keypressReady) {
    readline.emitKeypressEvents(process.stdin);
    keypressReady = true;
  }
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve) => {
    function handle(text, key = {}) {
      if (key.ctrl && key.name === 'c') {
        finish();
        showCursor();
        writeLine('\nCancelled.');
        process.exit(130);
      }
      const done = onKey({name: key.name, text, ctrl: Boolean(key.ctrl)});
      if (done) {
        finish();
        resolve();
      }
    }
    function finish() {
      process.stdin.off('keypress', handle);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
    process.stdin.on('keypress', handle);
  });
}
