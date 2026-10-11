import {LocaleFile} from './localeFiles';

// Placeholders like ${0} and HTML tags must survive translation: a missing or doubled ${1}
// shows a wrong value in the game, a missing tag breaks the markup.
const PLACEHOLDER = /\$\{\d+\}/g;
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)[\s>/]/g;

function placeholders(text: string): string {
  return [...new Set(text.match(PLACEHOLDER) ?? [])].sort().join(' ');
}

function tags(text: string): string {
  return [...text.matchAll(TAG)].map((match) => match[0].startsWith('</') ? '/' + match[1] : match[1]).sort().join(' ');
}

export function checkPlaceholders(files: ReadonlyArray<LocaleFile>): Array<string> {
  const problems: Array<string> = [];
  for (const localeFile of files) {
    for (const [key, value] of Object.entries(localeFile.entries)) {
      // Empty means "not translated yet": the client shows the English text
      if (value === '') {
        continue;
      }
      if (placeholders(key) !== placeholders(value)) {
        problems.push(`${localeFile.file}: placeholders differ: "${key}" → "${value}"`);
      }
      if (tags(key) !== tags(value)) {
        problems.push(`${localeFile.file}: HTML tags differ: "${key}" → "${value}"`);
      }
    }
  }
  return problems;
}
