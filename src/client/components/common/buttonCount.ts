import {Resource} from '@/common/Resource';
import {CardResource} from '@/common/CardResource';

// What a counter inside a button counts: cards (black card with white number), M€ (the M€ graphic with the
// number in it) or another resource (number and icon as one badge in the resource's colour)
export type ButtonCountKind =
  | 'card'
  | 'megacredits'
  | 'steel'
  | 'titanium'
  | 'plants'
  | 'energy'
  | 'heat'
  | 'microbe'
  | 'floater';

export type ButtonCountPart = {
  kind: ButtonCountKind,
  value: number,
  // Income instead of an expense (selling patents): a "+" in front of the M€ graphic
  gain?: boolean,
  // Small connecting word in front of the counter ("Buy [3] for [9]"), English key, translated when shown
  word?: string,
};

const RESOURCE_KINDS: Readonly<Record<Resource, ButtonCountKind>> = {
  [Resource.MEGACREDITS]: 'megacredits',
  [Resource.STEEL]: 'steel',
  [Resource.TITANIUM]: 'titanium',
  [Resource.PLANTS]: 'plants',
  [Resource.ENERGY]: 'energy',
  [Resource.HEAT]: 'heat',
};

const CARD_RESOURCE_KINDS: Partial<Record<CardResource, ButtonCountKind>> = {
  [CardResource.MICROBE]: 'microbe',
  [CardResource.FLOATER]: 'floater',
};

// Counter kind for a stock resource or a resource on a card; undefined when there is no icon for it
export function resourceCountKind(resource: Resource | CardResource): ButtonCountKind | undefined {
  return RESOURCE_KINDS[resource as Resource] ?? CARD_RESOURCE_KINDS[resource as CardResource];
}

// Counter for chosen cards, with the total price ("Buy [3] for [9]") or the income ("Sell [2] for +[2]")
export function cardCount(count: number, price?: {perCard: number, gain?: boolean}): Array<ButtonCountPart> {
  const parts: Array<ButtonCountPart> = [{kind: 'card', value: count}];
  if (price !== undefined && price.perCard > 0) {
    parts.push({kind: 'megacredits', value: count * price.perCard, gain: price.gain, word: 'for'});
  }
  return parts;
}
