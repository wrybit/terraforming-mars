// Input building blocks: list with ↑/↓, text input, hidden input – each in a framed box.
// Every question has a default, so pressing Enter always leads to a working installation.
import {clearLines, hideCursor, readKeys, showCursor, write, writeLine} from './terminal.mjs';
import {box} from './ui/box.mjs';
import {BOX_INDENT, BOX_WIDTH, LIST_INDENT} from './ui/layout.mjs';
import {style} from './ui/theme.mjs';
import {padVisible, shortenMiddle} from './ui/text.mjs';

const POINTER = '❯';
const LABEL_WIDTH = 26;

/** Answered questions stay as one line above the next box. */
function answered(message, value) {
  writeLine(`${LIST_INDENT}${style.orange('✔')} ${padVisible(style.white(message), 28)} ${style.gray(shortenMiddle(value, 44))}`);
}

function draw(lines, previousCount) {
  clearLines(previousCount);
  write(`${lines.join('\n')}\n`);
  return lines.length;
}

function questionBox(message, progress, content, note) {
  const sections = [['', ...content, ...(note ? ['', `  ${note}`] : []), '']];
  // Blank line above: the box keeps its distance from the answered questions
  return ['', ...box({title: message, label: progress, sections, width: BOX_WIDTH, shape: 'square', indent: BOX_INDENT})];
}

/**
 * Selection list. `choices`: [{label, value, hint?, disabled?: string}]. `disabled` is the reason
 * shown in grey; such entries are skipped while moving.
 */
export async function select({message, choices, initial, progress}) {
  const selectable = choices.map((choice, index) => (choice.disabled ? -1 : index)).filter((index) => index >= 0);
  if (selectable.length === 0) {
    throw new Error(`No selectable option for "${message}"`);
  }
  const initialIndex = choices.findIndex((choice) => choice.value === initial && !choice.disabled);
  let cursor = initialIndex >= 0 ? initialIndex : selectable[0];
  let drawn = 0;

  function render() {
    const content = choices.map((choice, index) => {
      if (choice.disabled) {
        return `    ${style.gray(padVisible(choice.label, LABEL_WIDTH))}${style.gray(choice.disabled)}`;
      }
      if (index === cursor) {
        return `  ${style.purple(style.bold(`${POINTER} ${padVisible(choice.label, LABEL_WIDTH)}`))}${style.purple(choice.hint ?? '')}`;
      }
      return `    ${style.white(padVisible(choice.label, LABEL_WIDTH))}${style.gray(choice.hint ?? '')}`;
    });
    drawn = draw(questionBox(message, progress, content), drawn);
  }

  function move(step) {
    const position = selectable.indexOf(cursor);
    cursor = selectable[(position + step + selectable.length) % selectable.length];
  }

  hideCursor();
  render();
  await readKeys(({name}) => {
    if (name === 'up' || name === 'k') {
      move(-1);
    } else if (name === 'down' || name === 'j' || name === 'tab') {
      move(1);
    } else if (name === 'return' || name === 'enter') {
      return true;
    }
    render();
    return false;
  });
  clearLines(drawn);
  showCursor();
  answered(message, choices[cursor].label);
  return choices[cursor].value;
}

/** Yes/No as a selection list, so every question works the same way. */
export function confirm({message, initial = true, progress, yes = 'Yes', no = 'No'}) {
  return select({
    message,
    initial,
    progress,
    choices: [{label: yes, value: true}, {label: no, value: false}],
  });
}

/**
 * Text input. An empty input takes `initial`. `secret` shows dots instead of characters.
 * `validate` returns an error message or undefined.
 */
export async function input({message, initial = '', hint, secret = false, validate, progress}) {
  let value = '';
  let error;
  let drawn = 0;

  function render() {
    const shown = secret ? '●'.repeat(value.length) : value;
    const suggestion = secret && initial ? 'Enter keeps the suggestion' : initial;
    const line = value
      ? `  ${style.purple(`${POINTER} ${shown}▏`)}`
      : `  ${style.purple(`${POINTER} ▏`)}${style.gray(suggestion)}`;
    const note = error ? style.red(error) : (hint ? style.gray(hint) : '');
    drawn = draw(questionBox(message, progress, [line], note), drawn);
  }

  hideCursor();
  render();
  await readKeys(({name, text, ctrl}) => {
    if (name === 'return' || name === 'enter') {
      const candidate = value === '' ? initial : value.trim();
      error = validate?.(candidate);
      if (!error) {
        value = candidate;
        return true;
      }
    } else if (name === 'backspace') {
      value = value.slice(0, -1);
      error = undefined;
    } else if (ctrl && name === 'u') {
      value = '';
    } else if (text && !ctrl && text >= ' ' && text.length === 1) {
      value += text;
      error = undefined;
    }
    render();
    return false;
  });
  clearLines(drawn);
  showCursor();
  answered(message, value ? (secret ? '●'.repeat(Math.min(value.length, 12)) : value) : '–');
  return value;
}
