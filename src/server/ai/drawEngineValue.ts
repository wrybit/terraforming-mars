import {IPlayer} from '../IPlayer';
import {CardName} from '../../common/cards/CardName';
import {tuningOf} from './aiTuning';
import {remainingProductionPhases} from './gameProgress';
import {drawsPerGeneration} from './drawEngineBoost';
import {drawnCardValue} from './drawPriority';
import {cheapFirstPenalty} from './cheapFirst';

// People draw far more cards than the AI (27 against 14 per game on the public server) and play more of them. The
// value of a draw engine is already in the card value (drawEngineBoost.ts; a higher weight lost in rounds 121/122),
// so this is about timing, not worth: an engine played one generation later loses one generation of draws for good.
// cheapFirst puts expensive cards last, and engines are rarely cheap – so the AI held them back. Here an engine in
// hand is exempt from cheapFirst and gains the draws a delay of one generation would cost.

/**
 * drawEngineValue: extra value for playing a draw engine from hand now rather than later –
 * draws per generation × value of a drawn card × weight, plus the cheapFirst penalty taken back.
 * 0 when the rule is off, the card draws nothing or no production phase is left.
 */
export function drawEngineTimingBonus(player: IPlayer, card: CardName, playable: ReadonlySet<CardName>): number {
  const weight = tuningOf(player).drawEngineValue;
  if (weight <= 0) {
    return 0;
  }
  const remaining = remainingProductionPhases(player.game, player);
  const handCard = player.cardsInHand.find((candidate) => candidate.name === card);
  if (handCard === undefined || remaining <= 0) {
    return 0;
  }
  const draws = drawsPerGeneration(handCard, player);
  if (draws <= 0) {
    return 0;
  }
  return weight * draws * drawnCardValue(player, remaining) + cheapFirstPenalty(player, card, playable);
}
