// Options for unattended use: --port=8080, --answers=file.json, --defaults, --yes, --help.
import fs from 'node:fs';
import {QUESTIONS} from './questions.mjs';

function camelCase(text) {
  return text.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

export function parseArguments(argv) {
  const options = {answers: {}, useDefaults: false, skipConfirm: false, help: false, demo: false};
  for (const argument of argv) {
    const [rawKey, ...rest] = argument.replace(/^--/, '').split('=');
    const value = rest.join('=');
    const key = camelCase(rawKey);
    if (key === 'help' || key === 'h') {
      options.help = true;
    } else if (key === 'demo') {
      options.demo = true;
    } else if (key === 'defaults') {
      options.useDefaults = true;
    } else if (key === 'yes' || key === 'y') {
      options.skipConfirm = true;
    } else if (key === 'answers') {
      Object.assign(options.answers, JSON.parse(fs.readFileSync(value, 'utf8')));
    } else if (QUESTIONS.some((question) => question.id === key)) {
      options.answers[key] = value;
    } else {
      throw new Error(`Unknown option --${rawKey}. Use --help.`);
    }
  }
  return options;
}

/** Question id → option name, e.g. runMode → --run-mode (same in help and error messages). */
export function flagName(questionId) {
  return `--${questionId.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

export function helpText() {
  const lines = QUESTIONS.map((question) => {
    const flag = `${flagName(question.id)}=…`;
    return `  ${flag.padEnd(26)} ${question.message}`;
  });
  return `Terraforming Mars installer

Without options it asks every question (arrow keys + Enter).

Answer questions up front (for scripts and AI agents):
${lines.join('\n')}
  --answers=FILE.json        All answers as JSON, keys as above in camelCase
  --defaults                 Use the suggested value for every unanswered question
  --yes                      Do not ask for the final confirmation
  --demo                     Try every screen without installing anything
  --help                     This text

Values for select questions:
  --database=sqlite|postgres
  --run-mode=systemd|launchd|windows-task|docker|foreground|none
  --ai-engine=typescript|rust
`;
}
