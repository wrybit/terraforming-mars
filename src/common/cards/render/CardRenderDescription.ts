export type CardRenderDescription = {
  text: string,
  align: 'left' | 'center' | 'right',
  /** The text leads the card: above the icons and without parentheses, as it is the only text (Dune, Sardaukar Raid) */
  lead?: boolean,
}

export function isDescription(item: any): item is CardRenderDescription {
  return item && item.text && typeof(item.text) === 'string';
}
