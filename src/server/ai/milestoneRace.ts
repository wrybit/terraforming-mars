import {IPlayer} from '../IPlayer';
import {MAX_MILESTONES} from '../../common/constants';
import {tuningOf} from './aiTuning';

// Expected VP from milestones not yet claimed. Without it the AI only saw a milestone once it
// could claim it; in a test game the human claimed all three (15 VP) while the AI never got
// close. Progress towards a milestone now counts, more when the player leads the race.
// Kept below the 5 VP of a claimed milestone, so claiming (8 M€) stays the better move.

// Behind an opponent the race is often lost.
const BEHIND_FACTOR = 0.5;

// milestoneNear: human players on the public server claimed 24 milestones in 12 games, the AI 10; in four games
// the human took all three (15 VP), one of them lost by the AI by a single VP. General progress towards
// milestones costs the engine (round 33), so only a milestone a few steps away counts, and only while the
// player is not behind in that race.
const NEAR_SHARE = 0.6;

function nearClaimPoints(player: IPlayer, score: number, threshold: number, notBehind: boolean): number {
  const steps = tuningOf(player).milestoneNear;
  const missing = threshold - score;
  if (steps <= 0 || !notBehind || missing <= 0 || missing > steps) {
    return 0;
  }
  return 5 * NEAR_SHARE * (1 - missing / (steps + 1));
}

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
    potentials.push(5 * tuningOf(player).milestoneProgressShare * own * own * lead + nearClaimPoints(player, milestone.getScore(player), threshold, own >= bestOpponent));
  }
  // Only as many milestones as slots are left can still be won. Summing all of them made
  // claiming the last slot look like a loss: in a test game the AI had Gardener ready for three
  // generations and the human took it.
  return potentials.sort((a, b) => b - a).slice(0, slotsLeft).reduce((sum, value) => sum + value, 0);
}
