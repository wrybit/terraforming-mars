// Header of the installer: planet, wordmark and the status line of the system.
import {box} from './box.mjs';
import {BOX_INDENT, BOX_WIDTH, LIST_INDENT} from './layout.mjs';
import {planetLines} from './planet.mjs';
import {style} from './theme.mjs';
import {terminalColumns} from './text.mjs';

const TERRAFORMING = [
  '▀█▀ █▀▀ █▀█ █▀█ ▄▀█ █▀▀ █▀█ █▀█ █▀▄▀█ █ █▄ █ █▀▀',
  ' █  ██▄ █▀▄ █▀▄ █▀█ █▀  █▄█ █▀▄ █ ▀ █ █ █ ▀█ █▄█',
];
const MARS = ['█▀▄▀█ ▄▀█ █▀█ █▀', '█ ▀ █ █▀█ █▀▄ ▄█'];

function wordmarkLines() {
  return [
    '',
    style.orange(TERRAFORMING[0]),
    style.orange(TERRAFORMING[1]),
    '',
    '',
    style.white(MARS[0]),
    `${style.white(MARS[1])}   ${style.gray('installer')}`,
    '',
  ];
}

/** `checks`: [{label, ok}] for the status line, `note`: gray text at its end (e.g. "macOS arm64"). */
export function bannerLines({checks, note}) {
  const status = `  ${checks.map(({label, ok}) => `${ok ? style.orange('✔') : style.red('✖')} ${style.white(label)}`).join('   ')}   ${style.gray(`·  ${note}`)}`;
  // Narrow terminal: planet with a one-line title instead of the big letters
  const wide = terminalColumns() >= BOX_WIDTH + 4;
  const planet = wide ? planetLines(8, 18) : planetLines(6, 14);
  const words = wide ? wordmarkLines() : ['', '', `${style.orange(style.bold('TERRAFORMING'))} ${style.white(style.bold('MARS'))}`, style.gray('installer')];
  // One empty line above and below the planet inside the frame
  const top = ['', ...planet.map((line, index) => `  ${line}   ${words[index] ?? ''}`), ''];
  return [
    ...box({sections: [top, [status]], width: BOX_WIDTH, indent: BOX_INDENT}),
    style.gray(`${LIST_INDENT}↑/↓ choose · Enter confirm · Ctrl+C cancel`),
    '',
  ];
}
