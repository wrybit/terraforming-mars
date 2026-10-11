import fs from 'fs';
import path from 'path';
import {normalizeText} from './localeFiles';

// Texts the app can show: string values of the generated game data and string literals / template texts of the source.
export type UsedTexts = {texts: Set<string>, names: Set<string>};

const GENFILES = ['cards', 'colonies', 'milestones', 'awards', 'agendas', 'events'];

function collectStrings(value: unknown, into: Set<string>): void {
  if (typeof value === 'string') {
    into.add(normalizeText(value));
    // Multi-line texts (card help notes in Markdown) are translated line by line
    if (value.includes('\n')) {
      value.split('\n').filter((line) => line.trim() !== '').forEach((line) => into.add(normalizeText(line)));
    }
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, into));
  } else if (value !== null && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, into));
  }
}

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

// Each quote type on its own pass: a Vue attribute like :title="'Text'" nests one literal in another
const LITERALS = [/'((?:[^'\\\n]|\\.)*)'/g, /"((?:[^"\\\n]|\\.)*)"/g, /`((?:[^`\\]|\\.)*)`/g, />([^<>{}]+)</g];

// undefined when the generated data is missing (run `npm run build` first)
export function usedTexts(srcDir: string): UsedTexts | undefined {
  const texts = new Set<string>();
  const names = new Set<string>();
  for (const file of GENFILES) {
    const filename = path.join(srcDir, 'genfiles', file + '.json');
    if (!fs.existsSync(filename)) {
      return undefined;
    }
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    collectStrings(data, texts);
    for (const entry of Array.isArray(data) ? data : []) {
      if (typeof entry?.name === 'string') {
        names.add(normalizeText(entry.name));
      }
    }
  }
  for (const file of sourceFiles(srcDir, [])) {
    const content = fs.readFileSync(file, 'utf8');
    for (const literal of LITERALS) {
      for (const match of content.matchAll(literal)) {
        const text = match[1];
        if (text !== undefined && text.trim() !== '') {
          texts.add(normalizeText(text.replace(/\\(['"`])/g, '$1')));
        }
      }
    }
  }
  return {texts, names};
}
