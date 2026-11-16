// Answered inputs in the form the Rust bot reads (its replay translator): one step per nesting level,
// each with the input's English title. The lab repo's recorder writes the same steps.
import {OrOptions} from '../../inputs/OrOptions';
import {AndOptions} from '../../inputs/AndOptions';
import {SelectInitialCards} from '../../inputs/SelectInitialCards';

export type Step = {title: string, type: string, value?: unknown, index?: number};

/** The English title of an input with its placeholders filled in. */
export function titleOf(input: any): string {
  if (input === undefined) {
    return '?';
  }
  const title = input.title;
  if (typeof title === 'string') {
    return title;
  }
  return title.message.replace(/\$\{(\d+)\}/g, (placeholder: string, index: string) => String(title.data[Number(index)]?.value ?? placeholder));
}

/** Path from the outer input to the answered leaf. */
export function steps(input: any, response: any): Array<Step> {
  switch (response.type) {
  case 'or': {
    const option = input instanceof OrOptions ? input.options[response.index] : undefined;
    return [{title: titleOf(input), type: 'or', value: titleOf(option), index: response.index}, ...steps(option, response.response)];
  }
  case 'and':
  case 'initialCards': {
    const options: Array<any> = input instanceof AndOptions || input instanceof SelectInitialCards ? input.options : [];
    return [{title: titleOf(input), type: response.type, value: response.responses.map((inner: any, index: number) => steps(options[index], inner))}];
  }
  case 'projectCard':
    return [{title: titleOf(input), type: 'projectCard', value: {card: response.card, payment: response.payment}}];
  case 'card':
    return [{title: titleOf(input), type: 'card', value: response.cards}];
  case 'space':
    return [{title: titleOf(input), type: 'space', value: response.spaceId}];
  case 'player':
    return [{title: titleOf(input), type: 'player', value: response.player}];
  case 'option':
    return [{title: titleOf(input), type: 'option'}];
  default:
    return [{title: titleOf(input), type: response.type, value: response}];
  }
}
