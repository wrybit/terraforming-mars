import fs from 'fs';
import path from 'path';
import {normalizeText} from './localeFiles';

// Texts handed to the translation at known call sites (game log, prompts, titles, translateText, $t, ...).
// A text there that no language translates at all is a new English-only text: the coverage report cannot
// see it (it only knows texts that at least one language has), so it fails here.
const CALL_SITE = new RegExp(
  '(?:\\bmessage\\(|\\btitle\\s*[:=]\\s*|\\bbuttonLabel\\s*[:=]\\s*|(?:game|this)\\.log\\(|new\\s+(?:Select\\w*|OrOptions|AndOptions)\\(|' +
  '\\btranslateText(?:WithParams)?\\(|\\$t\\(|\\bwarning\\s*=\\s*|\\b(?:label|tooltip|placeholder|hint)\\s*:\\s*)\\s*' +
  '(\'(?:[^\'\\\\\\n]|\\\\.)*\'|"(?:[^"\\\\\\n]|\\\\.)*")(\\s*\\+)?',
  'g');

// Server parts no player sees: database, tools, server start-up and HTTP routes
const SKIPPED_DIRECTORIES = ['database', 'tools', 'server', 'routes'].map((directory) => path.join('src', 'server', directory) + path.sep);

function sourceFiles(dir: string, into: Array<string>): Array<string> {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'genfiles' && entry.name !== 'locales') {
        sourceFiles(full, into);
      }
    } else if (/\.(ts|vue)$/.test(entry.name)) {
      into.push(full);
    }
  }
  return into;
}

export function checkCallSites(params: {srcDir: string, rootDir: string, knownKeys: ReadonlySet<string>, allowlist: ReadonlySet<string>}): Array<string> {
  const problems: Array<string> = [];
  for (const dir of ['server', 'client', 'common']) {
    for (const file of sourceFiles(path.join(params.srcDir, dir), [])) {
      const relative = path.relative(params.rootDir, file);
      if (SKIPPED_DIRECTORIES.some((skipped) => relative.startsWith(skipped))) {
        continue;
      }
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, index) => {
        // Comments only describe texts
        if (/^\s*(\/\/|\*|<!--)/.test(line)) {
          return;
        }
        for (const match of line.matchAll(CALL_SITE)) {
          // A literal continued with "+" is only the start of the text: the whole text is checked by the coverage
          if (match[2] !== undefined) {
            continue;
          }
          // A double-quoted Vue binding like :title="$t('…')" is an expression; its inner literals are call sites of their own
          if (match[1].startsWith('"') && (match[1].includes("'") || (file.endsWith('.vue') && /[()?=]/.test(match[1])))) {
            continue;
          }
          const text = normalizeText(match[1].slice(1, -1).replace(/\\n/g, '\n').replace(/\\(['"])/g, '$1'));
          // Words only: CSS classes, ids and single lower-case tokens are no visible texts
          if (!/[A-Za-z]{3}/.test(text) || (!text.includes(' ') && !/^[A-Z]/.test(text))) {
            continue;
          }
          if (!params.knownKeys.has(text) && !params.allowlist.has(text)) {
            problems.push(`${relative}:${index + 1}: no language translates "${text}"`);
          }
        }
      });
    }
  }
  return problems;
}
