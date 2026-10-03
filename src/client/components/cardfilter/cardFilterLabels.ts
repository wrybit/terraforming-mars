import {CardType} from '@/common/cards/CardType';
import {CardResource} from '@/common/CardResource';
import {cardResourceCSS} from '@/client/components/common/cardResources';
import {TYPE_COLOR_CLASSES, typeLabel} from '@/client/components/cardlist/cardListOptions';

// Labels and icons of the filter options – shared by the filter menu and the active chips in the row.
// Same sources as the card list's filters, so both look alike.

export function typeOptionLabel(type: CardType): string {
  return typeLabel(type);
}

export function typeColorClass(type: CardType): string {
  return TYPE_COLOR_CLASSES[type];
}

export function tagIconClass(tag: string): string {
  return `card-tag tag-${tag}`;
}

export function resourceIconClass(resource: CardResource): string {
  return `card-resource ${cardResourceCSS[resource]}`;
}
