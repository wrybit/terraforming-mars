import * as path from 'path';
import {existsSync, readdirSync, readFileSync} from 'fs';
import {CardName} from '../../common/cards/CardName';

// Imported results (screenshots from Discord) name corporations as they appeared on screen –
// mostly in German ("Bergbau-Gilde"). But the statistics count by the English card name, otherwise
// "Mining Guild" and "Bergbau-Gilde" would be two different corporations. Reverse translation uses the same
// translation files the UI uses (assets/locales, generated at build time).

const defaultFolder = path.resolve(process.cwd(), './assets/locales');

export type CardNameResolver = (name: string) => CardName | undefined;

function key(name: string): string {
  return name.trim().toLowerCase();
}

export function createCardNameResolver(localesFolder: string = defaultFolder): CardNameResolver {
  const byName = new Map<string, CardName>();
  for (const cardName of Object.values(CardName)) {
    byName.set(key(cardName), cardName);
  }
  if (existsSync(localesFolder)) {
    for (const file of readdirSync(localesFolder).filter((candidate) => candidate.endsWith('.json'))) {
      const phrases: Record<string, string> = JSON.parse(readFileSync(path.join(localesFolder, file), 'utf8'));
      for (const [english, translated] of Object.entries(phrases)) {
        // English names take precedence: a translation must not redirect a real card name
        if (byName.get(key(english)) === english && translated.trim() !== '' && !byName.has(key(translated))) {
          byName.set(key(translated), english as CardName);
        }
      }
    }
  }
  return (name) => byName.get(key(name));
}

let defaultResolver: CardNameResolver | undefined;

/** English card name for a (possibly translated) name; undefined if there is no such card. */
export function resolveCardName(name: string): CardName | undefined {
  defaultResolver ??= createCardNameResolver();
  return defaultResolver(name);
}
