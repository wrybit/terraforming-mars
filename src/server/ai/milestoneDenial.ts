import {IPlayer} from '../IPlayer';
import {MAX_MILESTONES} from '../../common/constants';
import {tuningOf} from './aiTuning';

// A milestone the player could claim right now is not safe while an opponent is about to reach it too: in human
// games the AI put Generalist, Tycoon and Planner off for a card or an action (the claim was only 3–22 points
// behind) and the opponent claimed it – 5 VP lost and 5 VP for the opponent. The valuation saw the unclaimed
// milestone as if it could still be claimed next turn. milestoneDenial counts that risk as an expected loss of the
// claimable milestone while an opponent is near, so claiming now removes the loss and gains against the other moves.

/** An opponent this close to the threshold (share of it, at least one step) can reach it in this or the next generation. */
const NEAR_SHARE = 0.15;

/** Expected VP lost on milestones the player can claim now while an opponent is near them (≤ 0). */
export function milestoneDenialPoints(player: IPlayer): number {
  const weight = tuningOf(player).milestoneDenial;
  const game = player.game;
  if (weight <= 0 || game.claimedMilestones.length >= MAX_MILESTONES) {
    return 0;
  }
  let loss = 0;
  for (const milestone of game.milestones) {
    if (game.milestoneClaimed(milestone)) {
      continue;
    }
    const threshold = milestone.thresholdFor?.(game);
    if (threshold === undefined || threshold <= 0 || milestone.getScore(player) < threshold) {
      continue;
    }
    const near = Math.max(1, Math.ceil(threshold * NEAR_SHARE));
    if (player.opponents.some((opponent) => threshold - milestone.getScore(opponent) <= near)) {
      loss += 5 * weight;
    }
  }
  return -loss;
}
