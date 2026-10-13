import {IPlayer} from '../IPlayer';

// Strategy guides: an engine player keeps a big hand (20+ cards), a tempo player 10–12; whoever
// loses the income race should stop buying speculative cards and turn money into VP instead. The
// AI used one fixed hand target for every position.

const MINIMUM_FACTOR = 0.6;
const MAXIMUM_FACTOR = 1.8;

/** M€ per generation from production and TR (steel and titanium at their usual worth). */
function income(player: IPlayer): number {
  const production = player.production;
  return player.terraformRating + production.megacredits + production.steel * 2 + production.titanium * 3 +
    production.plants * 1.5 + production.heat * 0.5;
}

/**
 * Factor for the research hand target: own income against the strongest rival's, to the power
 * `weight` (aiTuning.ts planHand). Above 1 with the stronger engine, below 1 when behind.
 */
export function handTargetFactor(player: IPlayer, weight: number): number {
  if (weight <= 0 || player.opponents.length === 0) {
    return 1;
  }
  const rival = Math.max(...player.opponents.map(income));
  const ratio = income(player) / Math.max(1, rival);
  return Math.max(MINIMUM_FACTOR, Math.min(MAXIMUM_FACTOR, Math.pow(ratio, weight)));
}
