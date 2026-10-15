import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {SelectCard} from '../inputs/SelectCard';
import {InputResponse} from '../../common/inputs/InputResponse';
import {quickResponse} from './quickResponse';

// Follow-up questions in the middle of a move ("add a microbe or remove 3 for 1 TR", Olympus Conference,
// card choices of an action such as the Robotic Workforce copy target): the lookahead tries each option
// on game copies (actionLookahead.ts) and remembers the best one here, so the real game answers the same
// way. Before, every follow-up took the first option or a quick rule – about 8 decisions per game.

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

/** Single-card choice inside a move (exactly one card to pick). */
export function isSingleCardChoice(input: PlayerInput | undefined): input is SelectCard<any> {
  return input instanceof SelectCard && input.config.min === 1 && input.config.max === 1;
}

/** Response that picks option `index` of an OR question or card `index` of a single-card choice. */
export function plannedResponse(input: PlayerInput, index: number, player: IPlayer): InputResponse | undefined {
  if (input instanceof OrOptions) {
    const option = input.options[index];
    return option === undefined ? undefined : {type: 'or', index, response: quickResponse(option, player)};
  }
  if (isSingleCardChoice(input)) {
    const card = input.cards[index];
    return card === undefined || input.config.enabled?.[index] === false ? undefined : {type: 'card', cards: [card.name]};
  }
  return undefined;
}

/** Answer for a follow-up from the remembered plan, undefined without a usable plan entry. */
export function plannedFollowUp(input: PlayerInput, player: IPlayer): InputResponse | undefined {
  const plan = planByPlayer.get(player.id);
  if (plan === undefined || plan.length === 0) {
    return undefined;
  }
  const index = plan.shift() as number;
  const response = plannedResponse(input, index, player);
  if (response === undefined) {
    planByPlayer.delete(player.id);
  }
  return response;
}
