import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {tuningOf} from './aiTuning';

// Card-drawing cards are a priority (Jens' rule): humans played 7.6 of them per game, the AI 1.7 (28 two-player games
// against humans; a strong human 9.1, the AI 1.6 against him). A drawn card counted only 2 M€ like any card in hand,
// so Research, Technology Demonstration, AI Central or Development Center lost to almost anything. Cards that draw by
// action every generation matter most: they keep the hand full for the whole game.

/** Extra weight of cards drawn by an action every generation over cards drawn once. */
export const ACTION_DRAW_FACTOR = 1.25;

/** M€ a drawn card is worth: the rule value early, less once few generations remain to play it. */
export function drawnCardValue(player: IPlayer, remaining: number): number {
  const priority = tuningOf(player).drawPriority;
  return Math.max(LATE_CARD_VALUE, Math.min(priority, LATE_CARD_VALUE + PER_GENERATION * remaining));
}

/** Cards a card draws once when played (Research 2, Technology Demonstration 2; kept ones for a choice). */
export function immediateDraws(card: ICard): number {
  const draw = card.behavior?.drawCard;
  if (draw === undefined) {
    return 0;
  }
  if (typeof draw === 'number') {
    return draw;
  }
  return draw.keep ?? (typeof draw.count === 'number' ? draw.count : 1);
}

/**
 * Extra value of the cards a card draws when played, beyond the plain value they get as cards in hand (handValue):
 * for draft, buying and playing (cardValue.ts). 0 when the rule is off.
 */
export function immediateDrawBonus(card: ICard, player: IPlayer, remaining: number, handCardValue: number): number {
  if (tuningOf(player).drawPriority <= 0) {
    return 0;
  }
  return immediateDraws(card) * Math.max(0, drawnCardValue(player, remaining) - handCardValue);
}

// A card in hand late in the game is worth little more than its sale price.
const LATE_CARD_VALUE = 2;
const PER_GENERATION = 0.3;
