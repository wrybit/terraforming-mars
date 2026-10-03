import {reactive, ref} from 'vue';
import {CardModel} from '@/common/models/CardModel';
import {CardFilter, CardFilterContext, emptyCardFilter, matchesCardFilter, resetCardFilter} from '@/client/utils/cardFilter';
import {SortOrder} from '@/client/utils/SortOrder';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';

/** What happens to cards that don't match the filter: left out or shown dimmed. */
export type UnmatchedCards = 'hide' | 'dim';
export type CardVisibility = 'shown' | 'hidden' | 'dimmed';

const UNMATCHED_STORAGE_KEY = 'cardFilterUnmatched';

// Hand, play and sell share one filter – like the hand sorting: what you filter in one place stays in the others.
export const handCardFilter: CardFilter = reactive(emptyCardFilter());
// Played cards (own and other players') have their own filter: a different list for a different question.
export const playedCardFilter: CardFilter = reactive(emptyCardFilter());
// Sorting of the played cards; undefined = the order they were played in
export const playedCardsSortOrder = ref<SortOrder | undefined>(undefined);

function storedUnmatched(): UnmatchedCards {
  return safeLocalStorage.getItem(UNMATCHED_STORAGE_KEY) === 'dim' ? 'dim' : 'hide';
}

// Viewer preference, the same for all lists; kept across reloads
export const unmatchedCards = ref<UnmatchedCards>(storedUnmatched());

export function setUnmatchedCards(value: UnmatchedCards): void {
  unmatchedCards.value = value;
  safeLocalStorage.setItem(UNMATCHED_STORAGE_KEY, value);
}

export function cardVisibility(card: CardModel, filter: CardFilter, context: CardFilterContext): CardVisibility {
  if (matchesCardFilter(card, filter, context)) {
    return 'shown';
  }
  return unmatchedCards.value === 'dim' ? 'dimmed' : 'hidden';
}

/** For tests only: initial state. */
export function resetCardFilterState(): void {
  resetCardFilter(handCardFilter);
  resetCardFilter(playedCardFilter);
  playedCardsSortOrder.value = undefined;
  unmatchedCards.value = 'hide';
}
