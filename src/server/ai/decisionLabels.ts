import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {AndOptions} from '../inputs/AndOptions';
import {InputResponse} from '../../common/inputs/InputResponse';
import {getSpaceName} from '../../common/boards/spaces';
import {Units} from '../../common/Units';

// Readable labels for AI answers, e.g. "Play project card: Comet" or "Standard projects: City"
// (used by the decision trace; game logs and reviews read these, not raw response objects).

function titleOf(input: PlayerInput | undefined): string {
  if (input === undefined) {
    return '?';
  }
  const title = input.title;
  if (typeof title === 'string') {
    return title;
  }
  // Fill the placeholders, e.g. "Convert ${0} plants into greenery" → "Convert 8 plants …".
  return title.message.replace(/\$\{(\d+)\}/g, (placeholder, index) => String(title.data[Number(index)]?.value ?? placeholder));
}

function units(value: Partial<Units>): string {
  return Object.entries(value).filter(([, amount]) => amount !== 0 && amount !== undefined).map(([key, amount]) => `${amount} ${key}`).join(', ');
}

export function describeResponse(input: PlayerInput | undefined, response: InputResponse): string {
  switch (response.type) {
  case 'or': {
    const option = input instanceof OrOptions ? input.options[response.index] : undefined;
    const inner = describeResponse(option, response.response);
    return inner === '' ? titleOf(option) : `${titleOf(option)}: ${inner}`;
  }
  case 'and': {
    const options = input instanceof AndOptions ? input.options : [];
    return response.responses.map((inner, index) => describeResponse(options[index], inner)).filter((text) => text !== '').join(' + ');
  }
  case 'option':
    return '';
  case 'projectCard':
    return response.card;
  case 'card':
    return response.cards.length === 0 ? '(keine)' : response.cards.join(', ');
  case 'space':
    return getSpaceName(response.spaceId);
  case 'player':
    return response.player;
  case 'amount':
    return String(response.amount);
  case 'payment':
    return units(response.payment as unknown as Partial<Units>);
  case 'productionToLose':
    return `Produktion: ${units(response.units)}`;
  case 'resource':
    return response.resource;
  case 'resources':
    return units(response.units);
  case 'initialCards':
    return response.responses.map((inner) => describeResponse(undefined, inner)).join(' | ');
  default:
    return response.type;
  }
}
