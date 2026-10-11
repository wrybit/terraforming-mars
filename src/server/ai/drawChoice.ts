import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {tuningOf} from './aiTuning';

// Cards that let the player look at several cards and keep the best (Business Contacts: 4, keep 2;
// Invention Contest: 3, keep 1). On a game copy the kept cards count like any unknown card, so the
// choice itself was worth nothing: the AI valued Business Contacts at −2 and Invention Contest at 0
// while a human took both in the same game and built a card engine with them. Picking the card that
// fits the own game best out of several is worth more than drawing blindly.

/** Extra value of choosing from the cards seen but not kept, in M€ (aiTuning.ts drawChoiceValue). */
export function drawChoiceBonus(card: ICard, player: IPlayer): number {
  const weight = tuningOf(player).drawChoiceValue;
  if (weight <= 0) {
    return 0;
  }
  const draw = card.behavior?.drawCard;
  if (draw === undefined || typeof draw === 'number' || typeof draw.count !== 'number' || draw.keep === undefined) {
    return 0;
  }
  return weight * Math.max(0, draw.count - draw.keep);
}
