import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';
import {CardType} from '@/common/cards/CardType';
import {getCardsByType} from '@/client/utils/CardUtils';
import {sortActiveCards} from '@/client/utils/ActiveCardsSortingOrder';

// Own played blue cards (actions/effects) in the same order as in the player bar's card view,
// so you don't have to look for them in the modal from the hand cards tab.
export function ownActiveCards(playerView: PlayerViewModel): ReadonlyArray<CardModel> {
  return sortActiveCards(getCardsByType(playerView.thisPlayer.tableau, [CardType.ACTIVE]));
}
