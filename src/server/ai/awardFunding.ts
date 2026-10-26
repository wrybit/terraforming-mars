import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {InputResponse} from '../../common/inputs/InputResponse';
import {tuningOf} from './aiTuning';
import {awardConfidence} from './stateValue';
import {terraformingProgress} from './gameProgress';
import {fundMarginReached} from './awardFundMargin';

// Funding fixes an award for the rest of the game. Early in the game the valuation counts award leads as
// nothing (stateValue.ts awardConfidence), so a free funding (Nirgal Enterprises) looked as good as any
// other move: a test game funded all three awards in generation 1 at 0 : 0 and the human won all three
// (15 VP). awardFundingLead: only fund a free award with a real lead. For paid funding the gate cost
// 0.98 VP per game in round 77 (control noAwardLead), so it applies to free funding only.
// awardPaidEarlyLead: paid funding without any lead while a lead still counts nothing (award confidence 0, first
// half of the terraforming). A human-game AI paid for an award at 0 : 0 in generation 1: the static value of the
// funding was negative, but the lookahead compared it with passing so unsteadily that it won anyway.

function titleOf(input: PlayerInput): string {
  return typeof input.title === 'string' ? input.title : input.title.message;
}

/** Whether the player leads the award by at least the tuned share of the best opponent score. */
export function leadsAward(player: IPlayer, awardName: string): boolean {
  const share = tuningOf(player).awardFundingLead;
  const award = player.game.awards.find((candidate) => candidate.name === awardName);
  if (share <= 0 || award === undefined) {
    return true;
  }
  const own = award.getScore(player);
  const best = Math.max(0, ...player.opponents.map((opponent) => award.getScore(opponent)));
  return own - best >= Math.max(1, share * best);
}

/** Whether the player scores more than every opponent in the award (any lead, however small). */
function hasAnyLead(player: IPlayer, awardName: string): boolean {
  const award = player.game.awards.find((candidate) => candidate.name === awardName);
  if (award === undefined) {
    return true;
  }
  const own = award.getScore(player);
  return player.opponents.every((opponent) => own > award.getScore(opponent));
}

/** Paid funding is blocked while a lead counts nothing yet and the player does not lead (awardPaidEarlyLead). */
function paidFundingTooEarly(player: IPlayer, awardName: string): boolean {
  return tuningOf(player).awardPaidEarlyLead > 0 &&
    awardConfidence(terraformingProgress(player.game)) <= 0 &&
    !hasAnyLead(player, awardName);
}

/** Funding cost from the menu title "Fund an award (${0} M€)", undefined if unknown. */
function fundingCost(option: PlayerInput): number | undefined {
  const value = typeof option.title === 'string' ? undefined : option.title.data[0]?.value;
  const cost = Number(value);
  return Number.isFinite(cost) ? cost : undefined;
}

/** False for a move of the action menu that funds a free award the player does not lead, or (awardPaidEarlyLead) a
 * paid one without any lead while a lead still counts nothing, or (awardFundMargin) with a lead the opponent can catch up. */
export function fundingAllowed(option: PlayerInput, response: InputResponse, player: IPlayer): boolean {
  if (!(option instanceof OrOptions) || !titleOf(option).startsWith('Fund an award') || response.type !== 'or') {
    return true;
  }
  const award = option.options[response.index];
  if (award === undefined) {
    return true;
  }
  if (fundingCost(option) === 0) {
    return leadsAward(player, titleOf(award));
  }
  // awardFundMargin: paid funding only with a lead the best opponent cannot catch up (awardFundMargin.ts).
  return !paidFundingTooEarly(player, titleOf(award)) && fundMarginReached(player, titleOf(award));
}
