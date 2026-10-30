import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';
import {remainingProductionPhases} from './gameProgress';

// Test batches (baseline, round 158): in generations 10–14 the AI took a standard project while hand cards were
// playable 0.4–1.5 times per generation and player, about 70 M€ per game, while about 2 playable cards were still in
// hand when it passed. The flat standard project restraint (2 M€) holds early on, but late the hand shrinks into the
// last generations: a playable card left now is often never played. Late, every playable hand card adds a share,
// so a full playable hand weighs more than one card. Not in the last generation: there every move left is lost.

/** Generations before the last in which the late restraint applies. */
const LATE_PHASES = 3;
/** Playable hand cards that count at most. */
const MAXIMUM_CARDS = 3;

/** Extra M€ a standard project gives up late in the game per playable hand card (lateStandardRestraint); 0 = off. */
export function lateStandardPenalty(player: IPlayer, playableHandCards: number): number {
  const weight = tuningOf(player).lateStandardRestraint;
  if (weight <= 0 || playableHandCards <= 0) {
    return 0;
  }
  const remaining = remainingProductionPhases(player.game, player);
  if (remaining <= 0 || remaining > LATE_PHASES) {
    return 0;
  }
  return weight * Math.min(MAXIMUM_CARDS, playableHandCards);
}
