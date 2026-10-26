import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';
import {remainingProductionPhases} from './gameProgress';

// Self-funded awards were lost by narrow margins in 8 human games (6 : 7, 9 : 12, 15 : 21): the AI paid as soon
// as the valuation saw a small lead as a fair chance. awardFundMargin only allows paid funding when the lead is
// larger than what the best opponent can still catch up until the end: a base of 2 plus a share of that
// opponent's score per remaining production phase. Different from awardEngineSwing (round 142, dropped): that
// widened the swing by the opponent's draw and income engine; this is a gate on the funding move itself, judged
// on the award's own scores.

/** Share of the best opponent's score it can still add per remaining production phase. */
const CATCH_UP_SHARE = 0.1;
/** Points an opponent can always still gain (last actions of the game). */
const CATCH_UP_BASE = 2;

/** What the best opponent in this award can still catch up until the end of the game. */
export function awardCatchUp(player: IPlayer, awardName: string): number {
  const award = player.game.awards.find((candidate) => candidate.name === awardName);
  if (award === undefined) {
    return 0;
  }
  const best = Math.max(0, ...player.opponents.map((opponent) => award.getScore(opponent)));
  return CATCH_UP_BASE + best * CATCH_UP_SHARE * remainingProductionPhases(player.game, player);
}

/** False when awardFundMargin is on and the own lead does not exceed the catch-up (scaled by the weight). */
export function fundMarginReached(player: IPlayer, awardName: string): boolean {
  const weight = tuningOf(player).awardFundMargin;
  const award = player.game.awards.find((candidate) => candidate.name === awardName);
  if (weight <= 0 || award === undefined) {
    return true;
  }
  const best = Math.max(0, ...player.opponents.map((opponent) => award.getScore(opponent)));
  return award.getScore(player) - best > weight * awardCatchUp(player, awardName);
}
