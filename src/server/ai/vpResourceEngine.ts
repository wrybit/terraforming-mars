import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';

// Cards that score VP through resources on them (animals, microbes, floaters: 1 VP per animal, 1 VP per 2 floaters …)
// are counted at a discount (accumulatorValue) because a flat, higher share lost in self-play (collectors up to 1:
// −1.3 to −2.2 VP). Human games show the opposite gap: card VP 20 : 69 and 52 : 64, single collectors scoring 10–14 VP.
// The difference is time – a collector played early gathers for many generations, one played late hardly at all.
// So only the generations beyond the last few get an extra share; the late-game value stays as it was.

/** Generations at the end of the game that get no extra share: the discounted value is right there. */
const LATE_GENERATIONS = 4;

/**
 * Extra VP for a resource collector in play: the part of its measured gathering that the discount (accumulatorValue)
 * leaves out, only for the generations beyond the last few, times vpResourceEngine.
 */
export function earlyCollectorPoints(player: IPlayer, pointsPerGeneration: number, rate: number, remaining: number): number {
  const weight = tuningOf(player).vpResourceEngine;
  const early = remaining - LATE_GENERATIONS;
  if (weight <= 0 || pointsPerGeneration <= 0 || early <= 0) {
    return 0;
  }
  const missingShare = Math.max(0, 1 - tuningOf(player).accumulatorValue);
  return weight * missingShare * rate * pointsPerGeneration * early;
}
