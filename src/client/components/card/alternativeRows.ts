import {CardRenderSymbolType} from '@/common/cards/render/CardRenderSymbolType';
import {isICardRenderSymbol, ItemType} from '@/common/cards/render/Types';

const isSymbol = (item: ItemType | undefined, type: string) => item !== undefined && isICardRenderSymbol(item) && item.type === type;
const isOr = (item: ItemType | undefined) => isSymbol(item, CardRenderSymbolType.OR);

// The spaces Mars puts around its word OR; the slash brings its own gap
function withoutSpacesAroundOr(row: ReadonlyArray<ItemType>): Array<ItemType> {
  return row.filter((item, index) => !isSymbol(item, CardRenderSymbolType.NBSP) || !(isOr(row[index - 1]) || isOr(row[index + 1])));
}

/**
 * Alternatives that the card spreads over several rows ("3 plants OR 3 microbes" / "OR 2 animals") joined into one
 * row: a row that begins with OR goes onto the end of the row before it, so does a row after one that ends with OR.
 * Dune cards show OR as a slash, so the alternatives fit next to each other (Jens 21 Oct 2026); a row that is still too
 * wide gets smaller icons (Card.vue fitIntoCard). The spaces around OR go, the slash has its own gap.
 */
export function joinAlternativeRows(rows: ReadonlyArray<ReadonlyArray<ItemType>>): Array<Array<ItemType>> {
  const joined: Array<Array<ItemType>> = [];
  for (const row of rows) {
    const previous = joined[joined.length - 1];
    if (previous !== undefined && previous.length > 0 && row.length > 0 && (isOr(row[0]) || isOr(previous[previous.length - 1]))) {
      previous.push(...row);
    } else {
      joined.push([...row]);
    }
  }
  return joined.map(withoutSpacesAroundOr);
}
