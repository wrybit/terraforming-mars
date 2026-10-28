import {CardRenderItemType} from '@/common/cards/render/CardRenderItemType';
import {CardRenderSymbolType} from '@/common/cards/render/CardRenderSymbolType';
import {ICardRenderSymbol, isICardRenderItem, isICardRenderSymbol, ItemType} from '@/common/cards/render/Types';
import {Size} from '@/common/cards/render/Size';

// Resources a player owns; global parameters and TR keep their row without a sign
const RESOURCE_TYPES: ReadonlyArray<string> = [
  CardRenderItemType.MEGACREDITS,
  CardRenderItemType.STEEL,
  CardRenderItemType.TITANIUM,
  CardRenderItemType.PLANTS,
  CardRenderItemType.ENERGY,
  CardRenderItemType.HEAT,
  CardRenderItemType.CARDS,
  CardRenderItemType.RESOURCE,
];

const PLUS: ICardRenderSymbol = {is: 'symbol', type: CardRenderSymbolType.PLUS, size: Size.MEDIUM, isIcon: true};

const startsWithMinus = (row: ReadonlyArray<ItemType>) =>
  row.length > 0 && isICardRenderSymbol(row[0]) && row[0].type === CardRenderSymbolType.MINUS;
const isGainRow = (row: ReadonlyArray<ItemType>) =>
  row.length > 0 && row.every((item) => isICardRenderItem(item) && RESOURCE_TYPES.includes(item.type));

/**
 * On a card with a row that takes resources ("− 4 plants of any player"), the rows that give resources get a plus in
 * front, so gain and loss stand as a pair and the icons line up (Dune, Big Asteroid; Jens 28 Oct 2026). Mars keeps
 * its rows as they are.
 */
export function signGainRows(rows: ReadonlyArray<ReadonlyArray<ItemType>>): Array<Array<ItemType>> {
  if (!rows.some(startsWithMinus)) {
    return rows.map((row) => [...row]);
  }
  return rows.map((row) => isGainRow(row) ? [PLUS, ...row] : [...row]);
}
