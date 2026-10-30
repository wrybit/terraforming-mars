import {IPlayer} from '../IPlayer';
import {InputResponse} from '../../common/inputs/InputResponse';
import {isIProjectCard} from '../cards/IProjectCard';
import {tuningOf} from './aiTuning';
import {maximumExceeded} from './requirementOutlook';

// Test batches (baseline, round 158): at the end of a game 1.3 cards per player had never once been playable; the
// most frequent are cards with a maximum requirement the planet has passed (temperature, oxygen, oceans). Such a card
// can never be played again, yet before the last generation the AI only sells cards to afford a claim. When it
// passed, about 7 hand cards were too expensive and 4–5 M€ were left – one or two M€ from dead cards can pay for a
// card. Offered as one sale; whether it pays off now is left to the search.

/** Hand cards whose maximum requirement is exceeded: they can never be played again. */
export function deadHandCards(player: IPlayer) {
  return player.cardsInHand.filter((card) => isIProjectCard(card) && maximumExceeded(card, player));
}

/** The sale of all dead hand cards before the last generation; empty when off or none. */
export function deadCardSaleResponses(player: IPlayer): Array<InputResponse> {
  if (tuningOf(player).deadCardSale <= 0) {
    return [];
  }
  const dead = deadHandCards(player);
  return dead.length === 0 ? [] : [{type: 'card', cards: dead.map((card) => card.name)}];
}
