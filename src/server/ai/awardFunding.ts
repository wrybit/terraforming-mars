import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {InputResponse} from '../../common/inputs/InputResponse';
import {tuningOf} from './aiTuning';

// Funding fixes an award for the rest of the game. Early in the game the valuation counts award leads as
// nothing (stateValue.ts awardConfidence), so a free funding (Nirgal Enterprises) looked as good as any
// other move: a test game funded all three awards in generation 1 at 0 : 0 and the human won all three
// (15 VP). awardFundingLead: only fund with a real lead.

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

/** False for a move of the action menu that funds an award the player does not lead. */
export function fundingAllowed(option: PlayerInput, response: InputResponse, player: IPlayer): boolean {
  if (!(option instanceof OrOptions) || !titleOf(option).startsWith('Fund an award') || response.type !== 'or') {
    return true;
  }
  const award = option.options[response.index];
  return award === undefined || leadsAward(player, titleOf(award));
}
