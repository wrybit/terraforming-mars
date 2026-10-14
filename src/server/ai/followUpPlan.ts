import {IPlayer} from '../IPlayer';
import {OrOptions} from '../inputs/OrOptions';
import {InputResponse} from '../../common/inputs/InputResponse';
import {quickResponse} from './quickResponse';

// Follow-up questions in the middle of a move ("add a microbe or remove 3 for 1 TR", Olympus Conference,
// card choices of an action): the lookahead tries each option on game copies (actionLookahead.ts) and
// remembers the best one here, so the real game answers the same way. Before, every follow-up took the
// first option – about 8 decisions per game.

const planByPlayer = new Map<string, Array<number>>();

export function setFollowUpPlan(player: IPlayer, plan: ReadonlyArray<number>): void {
  planByPlayer.set(player.id, [...plan]);
}

export function clearFollowUpPlan(player: IPlayer): void {
  planByPlayer.delete(player.id);
}

/** Forgets all plans (test batches reuse player ids from game to game). */
export function clearFollowUpPlans(): void {
  planByPlayer.clear();
}

/** Answer for an OR follow-up from the remembered plan, undefined without a usable plan entry. */
export function plannedFollowUp(input: OrOptions, player: IPlayer): InputResponse | undefined {
  const plan = planByPlayer.get(player.id);
  if (plan === undefined || plan.length === 0) {
    return undefined;
  }
  const index = plan.shift() as number;
  const option = input.options[index];
  if (option === undefined) {
    planByPlayer.delete(player.id);
    return undefined;
  }
  return {type: 'or', index, response: quickResponse(option, player)};
}
