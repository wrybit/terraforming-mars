import measuredCardIncomeData from './data/measuredCardIncome.json';
import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {tuningOf} from './aiTuning';
import {energySupplyRatio} from './energySupply';

// What a card with a lasting effect or action brings per generation, measured offline on many game copies (effect:
// the same random cards played with and without it; action: used once with usual stocks). Without it, every effect
// counted a flat 1 M€ and every action 1.5 M€ per generation: Earth Catapult (about 4 M€ per generation measured),
// Anti-Gravity Technology or Media Group looked like any other blue card.

type Income = {effect?: number, action?: number};
const INCOME: Readonly<Record<string, Income>> = measuredCardIncomeData;

/**
 * measuredCardIncome: measured M€ per generation of a card in play, weighted (0 when the rule is off or the card was
 * not measured). Negative measurements are noise and count as 0. The action was measured with enough energy; it only
 * counts the share the player's energy can feed (Ironworks, Physics Complex need 4–6 energy every generation).
 */
export function measuredCardIncome(player: IPlayer, card: ICard, remaining: number): number {
  const weight = tuningOf(player).measuredCardIncome;
  const income = INCOME[card.name];
  if (weight <= 0 || income === undefined) {
    return 0;
  }
  const action = Math.max(0, income.action ?? 0) * energySupplyRatio(player, card, Math.max(1, remaining));
  return weight * (Math.max(0, income.effect ?? 0) + action);
}
