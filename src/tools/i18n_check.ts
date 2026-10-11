// Translation checks for `npm run lint:i18n` (see src/tools/i18n/)
import fs from 'fs';
import path from 'path';
import {readLocaleFiles, translatedKeys} from './i18n/localeFiles';
import {checkPlaceholders} from './i18n/checkPlaceholders';
import {checkTemplates} from './i18n/checkTemplates';
import {reportCoverage} from './i18n/reportCoverage';
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

// Informational only: --missing lists the missing texts per language
console.log(reportCoverage(localeFiles, usedTexts(path.resolve('src')), process.argv.includes('--missing')).join('\n'));

for (const problem of problems) {
  console.log(problem);
}
if (problems.length > 0) {
  console.error(`${problems.length} translation problem(s). Translate them or, if intentional, add them to src/tools/i18n/allowlist.json.`);
  process.exit(1);
}
