import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {AiPossibleAction} from '../../common/ai/AiDecisionSummary';

// What the action menu offered at a decision: every action with the cards it could be done with
// (playable project cards, affordable standard projects, usable card actions). Next to a pass it
// shows what the AI could still have done – independent of how many moves its search tried.

function cardNamesOf(option: PlayerInput): Array<string> | undefined {
  const withCards = option as unknown as {cards?: ReadonlyArray<{name: string}>, config?: {enabled?: ReadonlyArray<boolean>}, enabled?: ReadonlyArray<boolean>};
  if (!Array.isArray(withCards.cards)) {
    return undefined;
  }
  const enabled = withCards.enabled ?? withCards.config?.enabled;
  return withCards.cards.filter((_, index) => enabled === undefined || enabled[index] !== false).map((card) => card.name);
}

export function possibleActionsOf(input: PlayerInput): Array<AiPossibleAction> | undefined {
  if (!(input instanceof OrOptions)) {
    return undefined;
  }
  return input.options.map((option) => {
    const title = option.title;
    const action: AiPossibleAction = typeof title === 'string' ?
      {title} :
      {title: title.message, params: title.data.map((datum) => String(datum.value))};
    const cards = cardNamesOf(option);
    if (cards !== undefined) {
      action.cards = cards;
    }
    return action;
  });
}
