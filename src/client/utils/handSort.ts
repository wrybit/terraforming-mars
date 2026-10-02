import {ref} from 'vue';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {CardOrder, CardOrderStorage} from '@/client/utils/CardOrderStorage';
import {SortOrder, sortCards} from '@/client/utils/SortOrder';

// Chosen sort order of the hand cards, shared by the hand tab and selection dialogs (e.g. selling):
// sorting in one place shows the same order in all others. undefined = "Manual".
const currentSortOrder = ref<SortOrder | undefined>(undefined);
// Own order before the first sort – "Manual" restores it. Not reactive: just a cache.
let manualOrder: CardOrder | undefined;

function writeOrder(playerId: string, cardNames: ReadonlyArray<CardName>): void {
  const order: CardOrder = {};
  cardNames.forEach((cardName, index) => order[cardName] = index + 1);
  CardOrderStorage.updateCardOrder(playerId, order);
}

function orderedHand(playerId: string, cards: ReadonlyArray<CardModel>): ReadonlyArray<CardModel> {
  return CardOrderStorage.getOrdered(CardOrderStorage.getCardOrder(playerId), cards);
}

/** Current sort order of the hand; undefined while the own order applies. */
export function handSortOrder(): SortOrder | undefined {
  return currentSortOrder.value;
}

/**
 * Sorts the whole hand (`cards`) by `sortOrder` and stores the order.
 * undefined restores the own order from before the first sort; cards drawn since then go to the end.
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

/** Own order via drag & drop: clears the chosen sort order, the bar switches to "Manual". */
export function reorderHandManually(playerId: string, cardNames: ReadonlyArray<CardName>): void {
  currentSortOrder.value = undefined;
  manualOrder = undefined;
  writeOrder(playerId, cardNames);
}

/** For tests only: initial state without a chosen sort order. */
export function resetHandSort(): void {
  currentSortOrder.value = undefined;
  manualOrder = undefined;
}
