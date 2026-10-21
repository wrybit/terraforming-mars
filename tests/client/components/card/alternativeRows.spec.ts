import {expect} from 'chai';
import {joinAlternativeRows} from '@/client/components/card/alternativeRows';
import {CardRenderSymbolType} from '@/common/cards/render/CardRenderSymbolType';
import {ItemType} from '@/common/cards/render/Types';
import {Size} from '@/common/cards/render/Size';

const or = {type: CardRenderSymbolType.OR, size: Size.SMALL, is: 'symbol'} as ItemType;
const space = {type: CardRenderSymbolType.NBSP, size: Size.MEDIUM, is: 'symbol'} as ItemType;
const plants = 'plants' as ItemType;
const microbes = 'microbes' as ItemType;
const animals = 'animals' as ItemType;

describe('alternativeRows', () => {
  it('joins a row that begins with OR onto the row before it', () => {
    expect(joinAlternativeRows([[plants, or, microbes], [or, animals]])).deep.eq([[plants, or, microbes, or, animals]]);
  });

  it('joins the row after one that ends with OR', () => {
    expect(joinAlternativeRows([[plants, or], [animals]])).deep.eq([[plants, or, animals]]);
  });

  it('drops the spaces around OR, the slash brings its own gap', () => {
    expect(joinAlternativeRows([[plants, space, or, space, microbes], [or, space, animals]])).deep.eq([[plants, or, microbes, or, animals]]);
    expect(joinAlternativeRows([[plants, space, microbes]])).deep.eq([[plants, space, microbes]]);
  });

  it('keeps rows without OR at their seam apart', () => {
    expect(joinAlternativeRows([[plants, or, microbes], [animals]])).deep.eq([[plants, or, microbes], [animals]]);
    expect(joinAlternativeRows([[], [or, animals]])).deep.eq([[], [or, animals]]);
  });
});
