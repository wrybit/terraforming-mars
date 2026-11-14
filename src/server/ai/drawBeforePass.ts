import {IPlayer} from '../IPlayer';
import {OrOptions} from '../inputs/OrOptions';
import {InputResponse} from '../../common/inputs/InputResponse';
import {tuningOf} from './aiTuning';
import {drawnCardValue} from './drawPriority';
import {cardsDrawnByMove} from './spareMoneyDraw';
import {remainingProductionPhases} from './gameProgress';

// Human players use their draw actions (Development Center, Restricted Area, Inventors' Guild …) about once per
// generation they own them; the AI only every second generation (96 Oracle games, 12.11.: Development Center 0.94 vs
// 0.55, Hi-Tech Lab 0.93 vs 0.43). Passing while such an action is still open gives up the cards it would draw.

/**
 * M€ taken off passing while one of the offered moves still draws cards: drawBeforePass × cards drawn by the best
 * of them × value of a drawn card. 0 when the rule is off or no move draws.
 */
export function drawBeforePassPenalty(player: IPlayer, menu: OrOptions, responses: ReadonlyArray<InputResponse>): number {
  const weight = tuningOf(player).drawBeforePass;
  if (weight <= 0) {
    return 0;
  }
  const draws = Math.max(0, ...responses.map((response) => cardsDrawnByMove(player, menu, response)));
  return draws > 0 ? weight * draws * drawnCardValue(player, remainingProductionPhases(player.game, player)) : 0;
}
