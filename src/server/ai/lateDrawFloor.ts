import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';

// A drawn card late in the game counted only 2–3 M€ (drawPriority.ts: 2 + 0.3 × remaining generations). Humans play
// late draw cards (generations 9–13) and spend what they draw at once: they draw 28.9 cards per game outside the
// research phase, the AI 8.1, and lay 5–8 cards per generation from generation 7 on (AI 3.6–4.1). With a large late
// income a drawn card is almost sure to be played right away, so its value should follow the income, not only the
// generations left. drawPriority 10 (round 130) raised the early value and lost – this floor only lifts the late one.

/** Highest late value of a drawn card (M€). */
const LATE_FLOOR_CAP = 6;
/** Income (M€ production + TR) per M€ of floor. */
const INCOME_PER_MEGACREDIT = 15;

/** Lower bound for the M€ value of a drawn card from the player's income; 0 when the rule is off. */
export function lateDrawFloor(player: IPlayer): number {
  const weight = tuningOf(player).lateDrawFloor;
  if (weight <= 0) {
    return 0;
  }
  const income = player.production.megacredits + player.terraformRating;
  return weight * Math.min(LATE_FLOOR_CAP, Math.max(0, income) / INCOME_PER_MEGACREDIT);
}
