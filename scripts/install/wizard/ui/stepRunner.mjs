// Runs the install steps as a live checklist: · waiting, spinner + time while running, ✔ done, ✖ failed.
// Command output goes to the log file; on failure its last lines are shown.
import fs from 'node:fs';
import {clearLines, hideCursor, isInteractive, showCursor, write, writeLine} from '../terminal.mjs';
import {LIST_INDENT} from './layout.mjs';
import {style} from './theme.mjs';
import {homeRelative, padVisible, shortenMiddle} from './text.mjs';

const SPINNER = ['◐', '◓', '◑', '◒'];
const TITLE_WIDTH = 28;
const BAR_WIDTH = 24;
const LOG_TAIL_LINES = 15;

function seconds(milliseconds) {
  const total = Math.round(milliseconds / 1000);
  return total < 60 ? `${total} s` : `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')} min`;
}

function bar(fraction) {
  const filled = Math.round(Math.min(1, Math.max(0, fraction)) * BAR_WIDTH);
  return `${style.purple('▓'.repeat(filled))}${style.gray('░'.repeat(BAR_WIDTH - filled))}  ${style.purple(`${Math.round(fraction * 100)} %`)}`;
}

function stepLine(step, frame, now) {
  if (step.state === 'done') {
    return `${LIST_INDENT}${style.orange('✔')} ${padVisible(style.white(step.title), TITLE_WIDTH)} ${style.gray(seconds(step.finishedAt - step.startedAt))}`;
  }
  if (step.state === 'failed') {
    return `${LIST_INDENT}${style.red('✖')} ${style.red(style.bold(step.title))}`;
  }
  if (step.state === 'running') {
    const detail = step.fraction === undefined ? style.gray(seconds(now - step.startedAt)) : bar(step.fraction);
    return `${LIST_INDENT}${style.purple(SPINNER[frame % SPINNER.length])} ${padVisible(style.white(style.bold(step.title)), TITLE_WIDTH)} ${detail}`;
  }
  return `${LIST_INDENT}${style.gray('·')} ${style.gray(step.title)}`;
}

function logTail(logFile) {
  try {
    return fs.readFileSync(logFile, 'utf8').trimEnd().split('\n').slice(-LOG_TAIL_LINES);
  } catch {
    return [];
  }
}

/**
 * `steps`: [{title, run(handle)}]; `handle.progress(0..1)` shows a bar instead of the time.
 * Throws the error of the first failing step after printing it with the end of the log.
 */
export async function runSteps(steps, {logFile}) {
  const items = steps.map((step) => ({...step, state: 'waiting'}));
  const live = isInteractive();
  let drawn = 0;
  let frame = 0;

  function render() {
    if (!live) {
      return;
    }
    clearLines(drawn);
    const lines = items.map((item) => stepLine(item, frame, Date.now()));
    write(`${lines.join('\n')}\n`);
    drawn = lines.length;
  }

  writeLine();
  hideCursor();
  const timer = live ? setInterval(() => {
    frame++;
    render();
  }, 120) : undefined;
  try {
    for (const item of items) {
      item.state = 'running';
      item.startedAt = Date.now();
      if (!live) {
        writeLine(`${LIST_INDENT}› ${item.title}`);
      }
      render();
      try {
        await item.run({progress: (fraction) => {
          item.fraction = fraction;
        }});
      } catch (error) {
        item.state = 'failed';
        render();
        throw error;
      }
      item.state = 'done';
      item.finishedAt = Date.now();
      if (!live) {
        writeLine(`${LIST_INDENT}✔ ${item.title} (${seconds(item.finishedAt - item.startedAt)})`);
      }
      render();
    }
  } catch (error) {
    clearInterval(timer);
    showCursor();
    const tail = logTail(logFile);
    if (tail.length > 0) {
      writeLine(`\n${LIST_INDENT}${style.gray(`Last lines of ${shortenMiddle(homeRelative(logFile), 56)}:`)}`);
      for (const line of tail) {
        writeLine(`${LIST_INDENT}${style.gray('│')} ${style.gray(shortenMiddle(line, 100))}`);
      }
    }
    throw error;
  }
  clearInterval(timer);
  showCursor();
}
