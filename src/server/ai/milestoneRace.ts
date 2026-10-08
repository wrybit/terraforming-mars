import {IPlayer} from '../IPlayer';
import {MAX_MILESTONES} from '../../common/constants';

// Expected VP from milestones not yet claimed. Without it the AI only saw a milestone once it
// could claim it; in a test game the human claimed all three (15 VP) while the AI never got
// close. Progress towards a milestone now counts, more when the player leads the race.
// Kept below the 5 VP of a claimed milestone, so claiming (8 M€) stays the better move.

// Share of the 5 VP a full progress is worth before the claim.
const BEFORE_CLAIM_SHARE = 0.5;
// Behind an opponent the race is often lost.
const BEHIND_FACTOR = 0.5;

export function milestoneRacePoints(player: IPlayer): number {
  const game = player.game;
  const slotsLeft = MAX_MILESTONES - game.claimedMilestones.length;
  if (slotsLeft <= 0) {
    return 0;
  }
  const potentials: Array<number> = [];
  for (const milestone of game.milestones) {
    if (game.claimedMilestones.some((claimed) => claimed.milestone.name === milestone.name)) {
      continue;
    }
    const threshold = milestone.thresholdFor?.(game);
    if (threshold === undefined || threshold <= 0) {
      continue;
    }
    const progress = (target: IPlayer) => Math.min(1, milestone.getScore(target) / threshold);
    const own = progress(player);
    const bestOpponent = Math.max(0, ...player.opponents.map(progress));
    const lead = own >= bestOpponent ? 1 : BEHIND_FACTOR;
    potentials.push(5 * BEFORE_CLAIM_SHARE * own * own * lead);
  }
  // Only as many milestones as slots are left can still be won. Summing all of them made
  // claiming the last slot look like a loss: in a test game the AI had Gardener ready for three
  // generations and the human took it.
  return potentials.sort((a, b) => b - a).slice(0, slotsLeft).reduce((sum, value) => sum + value, 0);
}
