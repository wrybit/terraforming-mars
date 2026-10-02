import * as path from 'path';
import {existsSync, readdirSync, readFileSync} from 'fs';
import {CardName} from '../../common/cards/CardName';

// Importierte Ergebnisse (Screenshots aus Discord) nennen Konzerne so, wie sie auf dem Bildschirm standen –
// meist auf Deutsch ("Bergbau-Gilde"). Die Statistik zählt aber nach dem englischen Kartennamen, sonst wären
// "Mining Guild" und "Bergbau-Gilde" zwei verschiedene Konzerne. Rückwärts übersetzt wird mit denselben
// Übersetzungsdateien, die auch die Oberfläche benutzt (assets/locales, beim Bauen erzeugt).

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
        // Englische Namen gehen vor: eine Übersetzung darf keinen echten Kartennamen umbiegen
        if (byName.get(key(english)) === english && translated.trim() !== '' && !byName.has(key(translated))) {
          byName.set(key(translated), english as CardName);
        }
      }
    }
  }
  return (name) => byName.get(key(name));
}

let defaultResolver: CardNameResolver | undefined;

/** Englischer Kartenname zu einem (evtl. übersetzten) Namen; undefined, wenn es keine solche Karte gibt. */
export function resolveCardName(name: string): CardName | undefined {
  defaultResolver ??= createCardNameResolver();
  return defaultResolver(name);
}
