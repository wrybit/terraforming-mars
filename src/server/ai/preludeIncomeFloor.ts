import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {tuningOf} from './aiTuning';

// In human games the AI had at most 1 M€ production until generation 5 in 8 games – once from the prelude pair
// Biosphere Support (−1 M€ production) + Polar Industries. Strong players secure some income in the opening: money
// decides how many cards they can play later. preludeIncomeFloor lowers the opening score of a corporation and
// prelude pair whose M€ production stays below 1, per missing step.

/** M€ production the opening should reach. */
const INCOME_FLOOR = 1;
/** Opening score (M€) per missing step of M€ production at weight 1. */
const STEP_VALUE = 6;

/** M€ production a card's own behavior sets (fixed numbers only; counted effects are left out). */
function megacreditProduction(card: ICard): number {
  const value = card.behavior?.production?.megacredits;
  return typeof value === 'number' ? value : 0;
}

/** Penalty (≥ 0, M€) for an opening that leaves the M€ production below the floor. */
export function preludeIncomePenalty(player: IPlayer, corporation: ICard, preludes: ReadonlyArray<ICard>): number {
  const weight = tuningOf(player).preludeIncomeFloor;
  if (weight <= 0 || preludes.length === 0) {
    return 0;
  }
  const production = [corporation, ...preludes].reduce((sum, card) => sum + megacreditProduction(card), 0);
  return weight * STEP_VALUE * Math.max(0, INCOME_FLOOR - production);
}
