import {ref} from 'vue';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {CardOrder, CardOrderStorage} from '@/client/utils/CardOrderStorage';
import {SortOrder, sortCards} from '@/client/utils/SortOrder';

// Gewählte Sortierung der Handkarten, geteilt von Hand-Tab und Auswahl-Dialogen (z. B. Verkaufen):
// wer an einer Stelle sortiert, sieht dieselbe Sortierung an allen anderen. undefined = "Manuell".
const currentSortOrder = ref<SortOrder | undefined>(undefined);
// Eigene Reihenfolge vor dem ersten Sortieren – "Manuell" stellt sie wieder her. Nicht reaktiv: nur Zwischenspeicher.
let manualOrder: CardOrder | undefined;

function writeOrder(playerId: string, cardNames: ReadonlyArray<CardName>): void {
  const order: CardOrder = {};
  cardNames.forEach((cardName, index) => order[cardName] = index + 1);
  CardOrderStorage.updateCardOrder(playerId, order);
}

function orderedHand(playerId: string, cards: ReadonlyArray<CardModel>): ReadonlyArray<CardModel> {
  return CardOrderStorage.getOrdered(CardOrderStorage.getCardOrder(playerId), cards);
}

/** Aktuelle Sortierung der Hand; undefined, solange die eigene Reihenfolge gilt. */
export function handSortOrder(): SortOrder | undefined {
  return currentSortOrder.value;
}

/**
 * Sortiert die ganze Hand (`cards`) nach `sortOrder` und speichert die Reihenfolge.
 * undefined stellt die eigene Reihenfolge von vor dem ersten Sortieren wieder her; seitdem neu gezogene Karten ans Ende.
 */
export function sortHand(playerId: string, cards: ReadonlyArray<CardModel>, sortOrder: SortOrder | undefined): void {
  const ordered = orderedHand(playerId, cards);
  if (sortOrder !== undefined) {
    if (currentSortOrder.value === undefined) {
      manualOrder = {...CardOrderStorage.getCardOrder(playerId)};
    }
    writeOrder(playerId, sortCards(ordered, sortOrder).map((card) => card.name));
  } else if (manualOrder !== undefined) {
    const own = manualOrder;
    const known = ordered.filter((card) => own[card.name] !== undefined)
      .sort((first, second) => own[first.name] - own[second.name]);
    const added = ordered.filter((card) => own[card.name] === undefined);
    writeOrder(playerId, [...known, ...added].map((card) => card.name));
    manualOrder = undefined;
  }
  currentSortOrder.value = sortOrder;
}

/** Eigene Reihenfolge per Drag & Drop: hebt die gewählte Sortierung auf, die Leiste springt auf "Manuell". */
export function reorderHandManually(playerId: string, cardNames: ReadonlyArray<CardName>): void {
  currentSortOrder.value = undefined;
  manualOrder = undefined;
  writeOrder(playerId, cardNames);
}

/** Nur für Tests: Ausgangszustand ohne gewählte Sortierung. */
export function resetHandSort(): void {
  currentSortOrder.value = undefined;
  manualOrder = undefined;
}
