import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {IProjectCard, isIProjectCard} from '../cards/IProjectCard';
import {CardType} from '../../common/cards/CardType';
import {tuningOf} from './aiTuning';

// Events whose discount only applies to the next card played (Indentured Workers: next card 8 M€ cheaper,
// −1 VP). Valued on a game copy, only the −1 VP showed: the discount needs a second card in the same
// generation, which the copy does not play. Humans played it 0.26 times per game, the AI 0.07 (value −5.5 M€).

/** Typical cost of the next card when the hand gives no hint (draft, empty hand). */
const TYPICAL_NEXT_COST = 12;

/** Discount of the next card right after `card` was played, 0 for cards without such a discount. */
function discountAfterPlaying(player: IPlayer, card: ICard, next: IProjectCard | undefined): number {
  if (card.type !== CardType.EVENT || card.getCardDiscount === undefined) {
    return 0;
  }
  // Read-only view of the player as if the event had just been played.
  const view = Object.create(player) as IPlayer;
  view.lastCardPlayed = card.name;
  try {
    return Math.max(0, card.getCardDiscount(view, next ?? (card as IProjectCard)));
  } catch {
    return 0;
  }
}

/**
 * nextCardDiscount: M€ an event saves on the next card, at most that card's cost (the most expensive other hand
 * card; without one a typical card), times the weight for the chance to play both in one generation.
 */
export function nextCardDiscountValue(player: IPlayer, card: ICard): number {
  const weight = tuningOf(player).nextCardDiscount;
  if (weight <= 0) {
    return 0;
  }
  const others = player.cardsInHand.filter((other): other is IProjectCard => isIProjectCard(other) && other.name !== card.name);
  const next = others.reduce<IProjectCard | undefined>((best, other) => (best === undefined || other.cost > best.cost ? other : best), undefined);
  const discount = discountAfterPlaying(player, card, next);
  if (discount <= 0) {
    return 0;
  }
  return weight * Math.min(discount, next?.cost ?? TYPICAL_NEXT_COST);
}
