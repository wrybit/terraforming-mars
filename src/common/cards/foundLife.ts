// Search For Life: once a microbe is found, the card is done for good (house rule of this fork).
// Server (action, card model) and client (look, "already used" section) share this rule.
import {CardName} from './CardName';

// Number of microbe pictures (assets/search-for-life/microbe-01.webp … microbe-12.webp)
export const FOUND_LIFE_VARIANT_COUNT = 12;

export function hasFoundLife(cardName: CardName, resources: number | undefined): boolean {
  return cardName === CardName.SEARCH_FOR_LIFE && resources !== undefined && resources > 0;
}

// Stable per game and player, so every viewer and every reload shows the same microbe
export function foundLifeVariant(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash % FOUND_LIFE_VARIANT_COUNT;
}

export function foundLifeImage(variant: number): string {
  return 'assets/search-for-life/microbe-' + String(variant + 1).padStart(2, '0') + '.webp';
}
