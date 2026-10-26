import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {effectDrawsPerGeneration} from './cardIncome';
import {tuningOf} from './aiTuning';

// Funded awards lost to a stronger engine (human games: Magnate, Contractor, Thermalist, Space Baron funded with a
// narrow lead; the human had more card draw or more income and overtook them). The award swing grew with the
// scores and the remaining generations, but not with how fast each side's engine grows. awardEngineSwing adds the
// opponent's engine advantage (income plus card draw per generation) to the swing: a narrow lead against a faster
// engine is less safe.

/** M€ a card drawn per generation counts in the engine comparison. */
const DRAW_ENGINE_VALUE = 3;
/** Engine advantage (M€ per generation) that adds one award point of swing per remaining generation. */
const ENGINE_PER_SWING_POINT = 10;

/** Income per generation (M€ production and TR) plus card draw of the tableau, in M€. */
export function engineStrength(player: IPlayer, drawsByAction: (card: ICard) => number): number {
  let draws = 0;
  for (const card of player.playedCards) {
    draws += drawsByAction(card) + effectDrawsPerGeneration(card, player);
  }
  return player.production.megacredits + player.terraformRating + DRAW_ENGINE_VALUE * draws;
}

/** Extra award swing from the strongest opponent's engine advantage over the player (0 when the rule is off). */
export function awardEngineSwing(player: IPlayer, remaining: number, drawsByAction: (card: ICard) => number): number {
  const weight = tuningOf(player).awardEngineSwing;
  if (weight <= 0 || remaining <= 0) {
    return 0;
  }
  const own = engineStrength(player, drawsByAction);
  const best = Math.max(own, ...player.opponents.map((opponent) => engineStrength(opponent, drawsByAction)));
  return weight * (best - own) / ENGINE_PER_SWING_POINT * remaining;
}
