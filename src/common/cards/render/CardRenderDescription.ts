import {isObject} from '@/common/utils/utils';

export type CardRenderDescription = {
  text: string,
  align: 'left' | 'center' | 'right',
  /** The text leads the card: above the icons and without parentheses, as it is the only text (Dune, Sardaukar Raid) */
  lead?: boolean,
}

export function isDescription(item: unknown): item is CardRenderDescription {
  return isObject(item) && 'text' in item && typeof item.text === 'string';
}
