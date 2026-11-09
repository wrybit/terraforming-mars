import * as fs from 'fs';
import * as path from 'path';
import {PLAYER_COLORS} from '../../common/Color';

// The create form names an empty seat after its colour ("Blue", in the creator's language) or "You" in a solo
// game. Many different people end up with these names, so the admin page merges them only one-time by default.
const DEFAULT_NAME_KEYS: ReadonlyArray<string> = [...PLAYER_COLORS.map((color) => color.charAt(0).toUpperCase() + color.slice(1)), 'You'];

let cached: Array<string> | undefined;

/** The default names in English and every language of the game (read once from the generated locale files). */
export function defaultPlayerNames(localesDir: string = path.resolve('assets/locales')): Array<string> {
  if (cached !== undefined) {
    return cached;
  }
  const names = new Set<string>(DEFAULT_NAME_KEYS);
  try {
    for (const file of fs.readdirSync(localesDir).filter((entry) => entry.endsWith('.json'))) {
      const translations: Record<string, unknown> = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
      for (const key of DEFAULT_NAME_KEYS) {
        const translated = translations[key];
        if (typeof translated === 'string' && translated.trim() !== '') {
          names.add(translated);
        }
      }
    }
  } catch {
    // No generated locale files (e.g. in tests): the English names still count
  }
  cached = [...names].sort();
  return cached;
}

/** For tests: read the locale files anew. */
export function forgetDefaultPlayerNamesForTesting(): void {
  cached = undefined;
}
