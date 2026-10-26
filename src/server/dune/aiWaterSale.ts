import {IPlayer} from '../IPlayer';
import {Resource} from '../../common/Resource';
import {remainingProductionPhases} from '../ai/gameProgress';

// Water (heat) at maximum temperature is worth nothing to burn: the AI converted it 13 times in a human game instead
// of passing. At the guild it can be sold. Water that still decides an award or a milestone stays: losing the award
// costs far more than the Solari of a sale, so the AI plans conservatively – what the opponents can still gain plus a
// buffer. Without such an award or milestone in the game all water may be sold.

/** Extra water kept above the best opponent's reachable score (and the reach for a milestone still to come). */
export const WATER_AWARD_BUFFER = 10;

type ScoreOf = (player: IPlayer) => number;

/** True if the score rises with the water (heat) stock. */
function countsWater(scoreOf: ScoreOf, player: IPlayer): boolean {
  const before = scoreOf(player);
  player.heat += 1;
  try {
    return scoreOf(player) > before;
  } finally {
    player.heat -= 1;
  }
}

/** Water an opponent can still add: energy turns into water at production, plus water and energy production. */
export function opponentWaterGain(opponent: IPlayer): number {
  const phases = remainingProductionPhases(opponent.game, opponent);
  return opponent.energy + (opponent.production.heat + opponent.production.energy) * Math.max(1, phases);
}

/** Water the player must keep so that the score stays at or above the target (all of it if already below). */
function waterForTarget(player: IPlayer, scoreOf: ScoreOf, target: number): number {
  const heat = player.heat;
  if (scoreOf(player) < target) {
    return heat;
  }
  let sellable = 0;
  try {
    while (sellable < heat) {
      player.heat = heat - sellable - 1;
      if (scoreOf(player) < target) {
        break;
      }
      sellable++;
    }
  } finally {
    player.heat = heat;
  }
  return heat - sellable;
}

/** Water kept for water awards: funded ones, and unfunded ones while award slots are open. */
function waterForAwards(player: IPlayer): number {
  const game = player.game;
  const funded = game.fundedAwards.map(({award}) => award);
  const open = game.allAwardsFunded() ? [] : game.awards.filter((award) => !funded.includes(award));
  let keep = 0;
  for (const award of [...funded, ...open]) {
    const scoreOf: ScoreOf = (target) => award.getScore(target);
    if (!countsWater(scoreOf, player)) {
      continue;
    }
    const best = Math.max(0, ...player.opponents.map(scoreOf));
    // Far behind already: the water cannot win this award any more.
    if (scoreOf(player) + WATER_AWARD_BUFFER < best) {
      continue;
    }
    const reachable = Math.max(0, ...player.opponents.map((opponent) => scoreOf(opponent) + opponentWaterGain(opponent)));
    keep = Math.max(keep, waterForTarget(player, scoreOf, reachable + WATER_AWARD_BUFFER));
  }
  return keep;
}

/** Water kept for an unclaimed water milestone that is reached or within reach, while milestone slots are open. */
function waterForMilestones(player: IPlayer): number {
  const game = player.game;
  if (game.allMilestonesClaimed()) {
    return 0;
  }
  const claimed = game.claimedMilestones.map(({milestone}) => milestone);
  let keep = 0;
  for (const milestone of game.milestones) {
    const scoreOf: ScoreOf = (target) => milestone.getScore(target);
    if (claimed.includes(milestone) || !countsWater(scoreOf, player)) {
      continue;
    }
    const threshold = milestone.thresholdFor?.(game) ?? 0;
    if (scoreOf(player) + WATER_AWARD_BUFFER < threshold) {
      continue;
    }
    keep = Math.max(keep, waterForTarget(player, scoreOf, threshold));
  }
  return keep;
}

/** Water units the player keeps for water awards and milestones. */
export function waterToKeepForAwards(player: IPlayer): number {
  return Math.max(waterForAwards(player), waterForMilestones(player));
}

/** Water the AI may sell at the guild: all of it at maximum temperature, minus what awards and milestones need. */
export function sellableWater(player: IPlayer): number {
  const game = player.game;
  if (game.getTemperature() < game.max.temperature) {
    return 0;
  }
  return Math.max(0, player.stock.get(Resource.HEAT) - waterToKeepForAwards(player));
}
