import {IPlayer} from '../IPlayer';
import {OrOptions} from '../inputs/OrOptions';
import {InputResponse} from '../../common/inputs/InputResponse';
import {tuningOf} from './aiTuning';
import {drawnCardValue} from './drawPriority';
import {cardsDrawnByMove} from './spareMoneyDraw';
import {remainingProductionPhases} from './gameProgress';

// The AI's hand grows to about 12 cards mid-game, 7.5 of them too expensive when it passes, and in a human game
// it ended with 32 cards – all drawn (AI Central, Restricted Area), not bought. Each further drawn card then only
// waits in hand. Unlike drawEngineValue (dropped, round 153) this does not change when engines are played: it
// lowers a draw move only while the hand is already full of cards the player cannot pay for.

/** Unplayable hand cards up to which drawing keeps its full value. */
const FREE_HAND = 6;
/** Further unplayable cards over which the drawn cards lose all their value. */
const FADE = 4;

/** M€ to take off a move that draws cards while the hand already holds many unplayable cards (0 when off). */
export function drawStopPenalty(player: IPlayer, menu: OrOptions, response: InputResponse): number {
  const weight = tuningOf(player).drawStop;
  if (weight <= 0) {
    return 0;
  }
  const draws = cardsDrawnByMove(player, menu, response);
  if (draws <= 0) {
    return 0;
  }
  const unplayable = player.cardsInHand.filter((card) => !player.canPlay(card)).length;
  const share = Math.min(1, Math.max(0, unplayable - FREE_HAND) / FADE);
  return weight * share * draws * drawnCardValue(player, remainingProductionPhases(player.game, player));
}
