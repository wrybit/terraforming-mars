import {IPlayer} from '../IPlayer';
import {MAX_MILESTONES} from '../../common/constants';
import {tuningOf} from './aiTuning';
import {victoryPointValue} from './gameProgress';

// Humans claim 2.2 milestones per game against the AI, the AI 0.8. Chasing milestone progress lost in self-play
// (milestoneNear −1.4 to −2.7) and so did defending a claimable one against a card (milestoneDenial −0.89). What is
// left: the AI reaches a milestone and then cannot pay the 8 M€ because the move before spent the money – the
// opponent claims first. This only keeps the claim money ready while a milestone is reached or one step away; it
// changes no progress value.

/** Score units a milestone may still be missing to count as "about to be reached". */
const NEAR_STEPS = 1;
/** Share of the 5 VP: the claim is not certain even with the money ready. */
const CLAIM_SHARE = 0.5;

/** True when an unclaimed milestone is reached or one step away for the player and a slot is free. */
function milestoneWithinReach(player: IPlayer): boolean {
  const game = player.game;
  if (game.claimedMilestones.length >= MAX_MILESTONES) {
    return false;
  }
  return game.milestones.some((milestone) => {
    if (game.milestoneClaimed(milestone)) {
      return false;
    }
    const threshold = milestone.thresholdFor?.(game) ?? 0;
    return threshold > 0 && threshold - milestone.getScore(player) <= NEAR_STEPS;
  });
}

/**
 * M€ taken off a position (after a move) in which a milestone is reached or one step away but the player's money is
 * below the claim cost: w × half of the milestone's 5 VP.
 */
export function milestoneReservePenalty(player: IPlayer): number {
  const weight = tuningOf(player).milestoneReserve;
  if (weight <= 0 || player.megaCredits >= player.milestoneCost() || !milestoneWithinReach(player)) {
    return 0;
  }
  return weight * CLAIM_SHARE * 5 * victoryPointValue(player.game, player);
}
