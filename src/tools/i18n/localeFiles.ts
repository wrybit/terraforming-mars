import fs from 'fs';
import path from 'path';

// One locale file, e.g. src/locales/de/ui.json, with its entries (English key → translation)
export type LocaleFile = {
  lang: string;
  file: string;
  entries: Record<string, string>;
};

// Every locale file of every language folder (two-letter folder names, like make_static_json.ts)
export function readLocaleFiles(localesDir: string): Array<LocaleFile> {
  const result: Array<LocaleFile> = [];
  for (const lang of fs.readdirSync(localesDir)) {
    const langDir = path.join(localesDir, lang);
    if (lang.length !== 2 || !fs.statSync(langDir).isDirectory()) {
      continue;
    }
    for (const file of fs.readdirSync(langDir)) {
      if (file.endsWith('.json')) {
        const entries = JSON.parse(fs.readFileSync(path.join(langDir, file), 'utf8'));
        result.push({lang, file: path.join(lang, file), entries});
      }
    }
  }
  return result;
}

// Same normalization as translateText in src/client/directives/i18n.ts, so keys match what the client looks up
export function normalizeText(text: string): string {
  return text.replace(/[\n\r]/g, '').replace(/[ ]+/g, ' ').trim();
}

// All English keys that have a non-empty translation in at least one language
export function translatedKeys(files: ReadonlyArray<LocaleFile>): Set<string> {
  const keys = new Set<string>();
  for (const localeFile of files) {
    for (const [key, value] of Object.entries(localeFile.entries)) {
      if (value !== '') {
        keys.add(normalizeText(key));
      }
    }
  }
  return keys;
}
