import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {tuningOf} from './aiTuning';
import {drawnCardValue} from './drawPriority';
import {effectDrawsPerGeneration} from './cardIncome';
import {cardsDrawnByAction} from './stateValue';

// Against humans the AI owns draw engines far less often (AI Central 3 vs 34 times, Restricted Area 12 vs 36,
// Development Center 11 vs 32 in 119 games), yet uses each copy about as often. The position value counts the
// drawn cards like any other card in hand; humans value an engine that brings cards every generation much higher,
// because those cards give options and card throughput for the rest of the game.

/** Cards a played card brings every generation (action or tag effect). */
export function drawsPerGeneration(card: ICard, player: IPlayer): number {
  return cardsDrawnByAction(card) + effectDrawsPerGeneration(card, player);
}

/**
 * drawEngineBoost: extra value of a draw engine for draft, buying and playing –
 * cards drawn per generation × value of a drawn card × remaining generations × weight.
 * 0 when the rule is off or the card draws nothing.
 */
export function drawEngineBonus(card: ICard, player: IPlayer, remaining: number): number {
  const weight = tuningOf(player).drawEngineBoost;
  if (weight <= 0 || remaining <= 0 || player.playedCards.has(card.name)) {
    return 0;
  }
  const draws = drawsPerGeneration(card, player);
  return draws > 0 ? weight * draws * drawnCardValue(player, remaining) * remaining : 0;
}
