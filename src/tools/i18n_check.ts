// Translation checks for `npm run lint:i18n` (see src/tools/i18n/)
import fs from 'fs';
import path from 'path';
import {readLocaleFiles, translatedKeys} from './i18n/localeFiles';
import {checkPlaceholders} from './i18n/checkPlaceholders';
import {checkTemplates} from './i18n/checkTemplates';
import {coverage, reportCoverage} from './i18n/reportCoverage';
import {usedTexts} from './i18n/usedTexts';

const rootDir = path.resolve('.');
const localeFiles = readLocaleFiles(path.resolve('src/locales'));
const allowlist: Array<string> = JSON.parse(fs.readFileSync(path.resolve('src/tools/i18n/allowlist.json'), 'utf8'));

const problems = [
  ...checkPlaceholders(localeFiles),
  ...checkTemplates({
    clientDir: path.resolve('src/client'),
    rootDir,
    knownKeys: translatedKeys(localeFiles),
    allowlist: new Set(allowlist),
  }),
];

// Every text the app shows must exist in all languages: a new or changed English text fails here until it is translated.
// Texts that are correct in English for a language (names, codes) go into src/tools/i18n/sameAsEnglish.json.
const sameAsEnglish: Record<string, Array<string>> = JSON.parse(fs.readFileSync(path.resolve('src/tools/i18n/sameAsEnglish.json'), 'utf8'));
const used = usedTexts(path.resolve('src'));
console.log(reportCoverage(localeFiles, used, sameAsEnglish, process.argv.includes('--missing')).join('\n'));
const missing = coverage(localeFiles, used, sameAsEnglish).languages.reduce((sum, language) => sum + language.missing.length, 0);

for (const problem of problems) {
  console.log(problem);
}
if (missing > 0) {
  problems.push(`${missing} text(s) without translation (npm run lint:i18n -- --missing lists them). Add them to fork_ui.json / fork_cards.json of every language.`);
}
if (problems.length > 0) {
  console.error(`${problems.length} translation problem(s). Translate them or, if intentional, add them to src/tools/i18n/allowlist.json.`);
  process.exit(1);
}
