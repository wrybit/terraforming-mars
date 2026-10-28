import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';

// The AI's M€ production stops growing after generation 9 (human 46 vs AI 27 in generation 14), although it leads in
// generation 5 (7.4 vs 5.6). Production is valued by the remaining production phases, and the length estimate shrinks
// fast once terraforming speeds up, so from about generation 8 production looks nearly worthless. Humans keep raising
// income until late and turn it into cards. Unlike the flat production multipliers (production115/125/140, all lost),
// this only stops the phase count from falling below a floor before generation 10.

/** Production phases counted at least while the floor applies. */
const PHASE_FLOOR = 3;
/** Last generation the floor applies to. */
const LAST_FLOOR_GENERATION = 10;

/** Remaining production phases for valuing production: at least the floor until generation 10, blended by weight. */
export function productionPhasesWithFloor(player: IPlayer, generation: number, remaining: number): number {
  const weight = tuningOf(player).lateProductionFloor;
  if (weight <= 0 || generation > LAST_FLOOR_GENERATION || remaining >= PHASE_FLOOR || remaining <= 0) {
    return remaining;
  }
  return remaining + Math.min(1, weight) * (PHASE_FLOOR - remaining);
}
