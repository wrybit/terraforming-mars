import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {SelectCard} from '../inputs/SelectCard';
import {SelectAmount} from '../inputs/SelectAmount';
import {InputResponse} from '../../common/inputs/InputResponse';
import {quickResponse} from './quickResponse';
import {isActionMenu} from './gameCopy';
import {tuningOf} from './aiTuning';

// Follow-up questions in the middle of a move ("add a microbe or remove 3 for 1 TR", Olympus Conference,
// card choices of an action such as the Robotic Workforce copy target, the X of Energy Market): the
// lookahead tries each choice on game copies (actionLookahead.ts) and remembers the best one here, so the
// real game answers the same way. Before, every follow-up took the first option or a quick rule.

/** Questions with more choices than this are left to the quick rules (time budget). */
const MAXIMUM_CHOICES = 6;

export type FollowUpChoice = {title: string, respond: () => InputResponse};

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

/**
 * Amounts worth trying for "choose X": the smallest, the middle and the largest. The quick rule always
 * took the largest – Energy Market spent 58 M€ of 59 on energy in the last generation.
 */
export function amountSamples(input: SelectAmount): Array<number> {
  return [...new Set([input.min, Math.floor((input.min + input.max) / 2), input.max])];
}

function titleOf(input: PlayerInput): string {
  return typeof input.title === 'string' ? input.title : input.title.message;
}

function orChoices(input: OrOptions, player: IPlayer, withAmounts: boolean): Array<FollowUpChoice> {
  return input.options.flatMap((option, index): Array<FollowUpChoice> => {
    if (withAmounts && option instanceof SelectAmount) {
      return amountSamples(option).map((amount) => ({
        title: `${titleOf(option)} (${amount})`,
        respond: () => ({type: 'or', index, response: {type: 'amount', amount}}),
      }));
    }
    return [{title: titleOf(option), respond: () => ({type: 'or', index, response: quickResponse(option, player)})}];
  });
}

/**
 * The choices of a follow-up question the lookahead tries one by one, undefined when the quick rules
 * answer it. The same state gives the same list, so an index chosen on a copy fits the real game.
 */
export function followUpChoices(input: PlayerInput | undefined, player: IPlayer): Array<FollowUpChoice> | undefined {
  const tuning = tuningOf(player);
  // followUpCards: single-card choices inside a move (e.g. the card Robotic Workforce copies).
  if (tuning.followUpCards > 0 && isSingleCardChoice(input)) {
    const cards = input.cards.filter((_card, index) => input.config.enabled?.[index] !== false);
    return cards.length < 2 || cards.length > MAXIMUM_CHOICES ? undefined :
      cards.map((card) => ({title: card.name, respond: () => ({type: 'card', cards: [card.name]})}));
  }
  // followUpAmounts: "choose X" right after the move (e.g. Power Infrastructure).
  if (tuning.followUpAmounts > 0 && input instanceof SelectAmount) {
    const amounts = amountSamples(input);
    return amounts.length < 2 ? undefined : amounts.map((amount) => ({title: `${amount}`, respond: () => ({type: 'amount', amount})}));
  }
  if (!(input instanceof OrOptions)) {
    return undefined;
  }
  // Read before isActionMenu: its type guard narrows the rejected branch to never.
  const options = input.options;
  if (isActionMenu(input) || options.length < 2 || options.length > MAXIMUM_CHOICES) {
    return undefined;
  }
  const withAmounts = orChoices(input, player, tuning.followUpAmounts > 0);
  return withAmounts.length <= MAXIMUM_CHOICES ? withAmounts : orChoices(input, player, false);
}

/** Response for choice `index` of a follow-up question, undefined if it does not exist. */
export function plannedResponse(input: PlayerInput, index: number, player: IPlayer): InputResponse | undefined {
  return followUpChoices(input, player)?.[index]?.respond();
}

/** Answer for a follow-up from the remembered plan, undefined without a usable plan entry. */
export function plannedFollowUp(input: PlayerInput, player: IPlayer): InputResponse | undefined {
  const plan = planByPlayer.get(player.id);
  if (plan === undefined || plan.length === 0 || followUpChoices(input, player) === undefined) {
    return undefined;
  }
  const index = plan.shift() as number;
  const response = plannedResponse(input, index, player);
  if (response === undefined) {
    planByPlayer.delete(player.id);
  }
  return response;
}
