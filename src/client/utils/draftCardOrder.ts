import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';

// Draft: the cards to choose from must never change places, not even when the pick is changed (repick)
// or the page is reloaded. The server keeps the order too (Draft.ts, draftOrder), but games saved before
// that, or a server restart in the middle of a round, would still move the pick to the end – so the
// client remembers the order it showed first and keeps it as long as the same cards are offered.
const STORAGE_PREFIX = 'draftCardOrder:';

function readOrder(playerId: string): Array<CardName> | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + playerId);
    return raw === null ? undefined : JSON.parse(raw) as Array<CardName>;
  } catch {
    return undefined;
  }
}

function writeOrder(playerId: string, order: Array<CardName>): void {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + playerId, JSON.stringify(order));
  } catch {
    // Without storage the order only stays stable within the server's own order
  }
}

export function keepDraftCardOrder<T extends CardModel>(playerId: string, cards: ReadonlyArray<T>): ReadonlyArray<T> {
  const remembered = readOrder(playerId);
  const names = cards.map((card) => card.name);
  const sameCards = remembered !== undefined && remembered.length === names.length && names.every((name) => remembered.includes(name));
  if (!sameCards) {
    writeOrder(playerId, names);
    return cards;
  }
  return [...cards].sort((a, b) => remembered.indexOf(a.name) - remembered.indexOf(b.name));
}
