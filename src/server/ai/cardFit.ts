import {IPlayer} from '../IPlayer';
import {CardName} from '../../common/cards/CardName';
import cardFitData from './data/bgaCardFit.json';

// How well a card fits the direction the own game has taken. Every game develops a flow – lots of
// terraforming, many cards, animals and plants, Jovian tags … – and many cards are good or bad only
// relative to it. Strong players feel that; the AI valued each card on today's position alone.
//
// The fit is learned, not written down: in 1,556 games of the 25 best Board Game Arena players
// (RuneDK93 dataset, MIT) the log lift of every card pair says how much more often than expected the
// two end up in the same tableau (Io Mining Industries with Water Import From Europa +0.79, with
// Ecoline −1.08). A card's fit is the mean lift to the own tableau and, at half weight, to the hand –
// the hand shows where the game is heading. The more cards are down, the clearer the flow.

const FIT = (cardFitData as {fit: Record<string, Record<string, number>>}).fit;
/** Hand cards count this much of a played card. */
const HAND_WEIGHT = 0.5;
/** Cards it takes until the flow counts fully. */
const CLEAR_FLOW_CARDS = 10;
const MAX_FIT = 0.6;

/** Mean log lift of `card` to the own tableau and hand, scaled by how clear the flow is (0 without data). */
export function flowFit(player: IPlayer, card: CardName): number {
  let sum = 0;
  let weight = 0;
  const add = (name: CardName, share: number) => {
    if (name === card || FIT[name] === undefined) {
      return;
    }
    sum += share * (FIT[name][card] ?? 0);
    weight += share;
  };
  for (const played of player.playedCards) {
    add(played.name, 1);
  }
  for (const held of player.cardsInHand) {
    add(held.name, HAND_WEIGHT);
  }
  if (weight === 0 || !hasFitData(card)) {
    return 0;
  }
  const clarity = Math.min(1, weight / CLEAR_FLOW_CARDS);
  return Math.max(-MAX_FIT, Math.min(MAX_FIT, sum / weight * clarity));
}

function hasFitData(card: CardName): boolean {
  return FIT[card] !== undefined;
}
