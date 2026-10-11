import {ALL_LANGUAGES, LANGUAGES} from '@/common/constants';
import {LocaleFile, normalizeText} from './localeFiles';
import {UsedTexts} from './usedTexts';

// A text the app shows counts as "to be translated" once any language translates it.
// Names (cards, colonies, ...) often stay English, so they only count once this many languages translate them.
const MIN_LANGUAGES = Math.ceil((ALL_LANGUAGES.length - 1) / 2);
const LATIN_SCRIPT = new Set(['de', 'fr', 'pl', 'es', 'br', 'it', 'nl', 'hu', 'nb', 'fi']);
// Codes and symbols like "AI", "2x" or "-X" read the same in every language
const WORD = /\p{Ll}{3}/u;

export type Coverage = {lang: string, name: string, translated: number, total: number, missing: Array<string>};

// Coverage per language: which commonly translated texts this language lacks
export function coverage(files: ReadonlyArray<LocaleFile>, used: UsedTexts | undefined): {total: number, languages: Array<Coverage>} {
  const keysByLang = new Map<string, Set<string>>();
  for (const localeFile of files) {
    if (localeFile.lang === 'en') {
      continue;
    }
    const keys = keysByLang.get(localeFile.lang) ?? new Set<string>();
    for (const [key, value] of Object.entries(localeFile.entries)) {
      if (value !== '') {
        keys.add(normalizeText(key));
      }
    }
    keysByLang.set(localeFile.lang, keys);
  }
  const counts = new Map<string, number>();
  for (const keys of keysByLang.values()) {
    for (const key of keys) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const isName = (key: string) => used === undefined || used.names.has(key) || used.names.has(key.split(':')[0]);
  const expected = [...counts]
    .filter(([key, count]) => WORD.test(key) && (used === undefined || used.texts.has(key)) && (count >= MIN_LANGUAGES || !isName(key)))
    .map(([key]) => key);
  const languages = ALL_LANGUAGES.filter((lang) => lang !== 'en').map((lang) => {
    const keys = keysByLang.get(lang) ?? new Set<string>();
    // Latin-script languages print names and many single words (Draft, Solo, Bank) like English, and an identical translation cannot be stored
    const expectedHere = LATIN_SCRIPT.has(lang) ? expected.filter((key) => !isName(key) && key.includes(' ')) : expected;
    const missing = expectedHere.filter((key) => !keys.has(key)).sort();
    return {lang, name: LANGUAGES[lang][1], translated: expectedHere.length - missing.length, total: expectedHere.length, missing};
  });
  return {total: expected.length, languages};
}

// Short console report; never fails the run
export function reportCoverage(files: ReadonlyArray<LocaleFile>, used: UsedTexts | undefined, verbose: boolean): Array<string> {
  const {total, languages} = coverage(files, used);
  const lines = [`Translation coverage (${total} texts${used === undefined ? ', without generated data: run npm run build first' : ''}):`];
  for (const language of [...languages].sort((a, b) => b.translated / b.total - a.translated / a.total)) {
    const percent = language.total === 0 ? 100 : Math.floor(language.translated / language.total * 1000) / 10;
    lines.push(`  ${language.name.padEnd(22)} ${String(percent).padStart(5)} %  ${language.missing.length} missing`);
    if (verbose) {
      lines.push(...language.missing.map((key) => `      ${key}`));
    }
  }
  return lines;
}
