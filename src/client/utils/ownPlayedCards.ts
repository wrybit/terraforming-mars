import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';
import {CardType} from '@/common/cards/CardType';
import {getCardsByType} from '@/client/utils/CardUtils';

// Card types of the played-cards section in the "All cards" tab. Active (blue) cards are missing on purpose:
// they have their own section at the top of the tab (ownActiveCards.ts).
const PLAYED_SECTION_TYPES: ReadonlyArray<CardType> = [CardType.CORPORATION, CardType.CEO, CardType.AUTOMATED, CardType.PRELUDE, CardType.EVENT];

export function ownPlayedCardsWithoutActive(playerView: PlayerViewModel): ReadonlyArray<CardModel> {
  return getCardsByType(playerView.thisPlayer.tableau, PLAYED_SECTION_TYPES);
}
