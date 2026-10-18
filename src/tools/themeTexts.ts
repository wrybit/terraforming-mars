// Theme texts (common/theme/Theme.ts): builds assets/themes/<theme>/texts/<lang>.json from the game's translations.
// A theme changes the wording, never the rules, so most texts come from the existing translation of every
// language with the theme's terms swapped in (src/themes/<theme>/terms/<lang>.json). Names that are not a
// simple swap (cards, houses, milestones, awards, places) come from src/themes/<theme>/names/<lang>.json.
// The client checks these texts before the normal translation (client/directives/i18n.ts).
import fs from 'fs';
import path from 'path';

/**
 * One swap: [pattern, replacement, options?]. The pattern is a regular expression, matched regardless of case
 * unless options is "case"; the replacement then follows the case of the match (matchCase). A leading "~" makes
 * it a whole word: no letter or digit may stand directly before or after it. The replacement may use $1…$9 for
 * groups and $T1…$T9 for a temperature group in °C turned into the water storage percent of Dune (°C + 30).
 */
export type TermRule = [pattern: string, replacement: string] | [pattern: string, replacement: string, options: 'case'];

export type ThemeTerms = {
  /** Applied in order to every text; longer and compound terms first */
  rules: ReadonlyArray<TermRule>,
  /** Whole texts that read better rewritten than swapped: English key → text */
  exact?: Record<string, string>,
  /** Names (keys of names/<lang>.json) that also appear inside texts, e.g. places named in card texts */
  namesInTexts?: ReadonlyArray<string>,
};

/** English key (card, corporation, milestone, award or place name) → themed name in this language */
export type ThemeNames = Record<string, string>;

type CompiledRule = {pattern: RegExp, replacement: string};

const WORD_START = '(?<![\\p{L}\\p{N}])';
const WORD_END = '(?![\\p{L}\\p{N}])';

export function compileRules(rules: ReadonlyArray<TermRule>): Array<CompiledRule> {
  return rules.map(([pattern, replacement, options]) => {
    const source = pattern.startsWith('~') ? `${WORD_START}(?:${pattern.slice(1)})${WORD_END}` : pattern;
    return {pattern: new RegExp(source, options === 'case' ? 'gu' : 'giu'), replacement};
  });
}

function replaceGroups(replacement: string, groups: ReadonlyArray<string | undefined>): string {
  return replacement.replace(/\$(T?)(\d)/g, (_match, temperature: string, index: string) => {
    const value = groups[Number(index) - 1] ?? '';
    if (temperature === 'T') {
      // Temperature −30 … +8 °C in 2° steps becomes the water storage 0 … 38 %
      return String(Number(value.replace('−', '-')) + 30);
    }
    return value;
  });
}

// The replacement follows the case of what it replaces, so one rule covers "ocean", "Ocean" and "OCEANS":
// a capital first letter stays capital, a word in capitals (4 letters or more, not abbreviations like TR) stays in capitals
function matchCase(match: string, replacement: string): string {
  const letters = match.replace(/[^\p{L}]/gu, '');
  if (letters.length > 1 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) {
    // Abbreviations (TR) take the replacement as written
    return letters.length >= 4 ? replacement.toUpperCase() : replacement;
  }
  const first = match.match(/\p{L}/u)?.[0];
  if (first !== undefined && first !== first.toLowerCase() && first === first.toUpperCase()) {
    return replacement.replace(/\p{L}/u, (letter) => letter.toUpperCase());
  }
  return replacement;
}

export function applyRules(text: string, rules: ReadonlyArray<CompiledRule>): string {
  let result = text;
  for (const rule of rules) {
    result = result.replace(rule.pattern, (...args) => {
      // args: match, group 1 … n, offset, whole text (and named groups when present)
      const groupCount = args.findIndex((arg) => typeof arg === 'number') - 1;
      const replaced = replaceGroups(rule.replacement, args.slice(1, 1 + groupCount) as Array<string | undefined>);
      return matchCase(args[0] as string, replaced);
    });
  }
  return result;
}

/**
 * Theme texts of one language: every key whose text changes, the names, then the exact texts.
 * `translations` is the language's merged translation file; `englishRules` handles keys it does not translate.
 */
export function themeTexts(
  keys: ReadonlyArray<string>,
  translations: Record<string, string>,
  rules: ReadonlyArray<CompiledRule>,
  englishRules: ReadonlyArray<CompiledRule>,
  names: ThemeNames,
  exact: Record<string, string>,
  isEnglish: boolean,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) {
    const translated = translations[key];
    const source = translated ?? key;
    const themed = applyRules(source, translated !== undefined || isEnglish ? rules : englishRules);
    if (themed !== source) {
      result[key] = themed;
    }
  }
  Object.assign(result, names, exact);
  return result;
}

function readJson<T>(file: string, fallback: T): T {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) as T : fallback;
}

/** Writes assets/themes/<theme>/texts/<lang>.json for every theme folder in src/themes and every language. */
export function writeThemeTexts(localesFolder: string, themesFolder: string, outputFolder: string): void {
  if (!fs.existsSync(themesFolder)) {
    return;
  }
  const languages = fs.readdirSync(localesFolder).filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -5));
  const translationsByLanguage = new Map(languages.map((lang) => [lang, readJson<Record<string, string>>(path.join(localesFolder, `${lang}.json`), {})]));
  const keys = [...new Set([...translationsByLanguage.values()].flatMap((translations) => Object.keys(translations)))];
  for (const theme of fs.readdirSync(themesFolder)) {
    const folder = path.join(themesFolder, theme);
    if (!fs.statSync(folder).isDirectory()) {
      continue;
    }
    // _all.json: rules for every language after its own ones (e.g. units next to placeholders)
    const common = readJson<ThemeTerms>(path.join(folder, 'terms', '_all.json'), {rules: []}).rules;
    const termsOf = (lang: string) => {
      const terms = readJson<ThemeTerms>(path.join(folder, 'terms', `${lang}.json`), {rules: []});
      return {...terms, rules: [...terms.rules, ...common]};
    };
    const englishRules = compileRules(termsOf('en').rules);
    fs.mkdirSync(path.join(outputFolder, theme, 'texts'), {recursive: true});
    const namesInTexts = readJson<ThemeTerms>(path.join(folder, 'terms', '_all.json'), {rules: []}).namesInTexts ?? [];
    for (const lang of languages) {
      const terms = termsOf(lang);
      const names = readJson<ThemeNames>(path.join(folder, 'names', `${lang}.json`), {});
      // A named place keeps its Mars name in most translations; inside texts it becomes the theme's name too
      const nameRules: Array<TermRule> = namesInTexts
        .filter((name) => names[name] !== undefined)
        .map((name) => [name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), names[name], 'case']);
      const texts = themeTexts(keys, translationsByLanguage.get(lang) ?? {}, compileRules([...nameRules, ...terms.rules]), englishRules,
        names, terms.exact ?? {}, lang === 'en');
      fs.writeFileSync(path.join(outputFolder, theme, 'texts', `${lang}.json`), JSON.stringify(texts));
    }
  }
}
