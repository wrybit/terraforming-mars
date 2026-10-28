import {expect} from 'chai';
import {signGainRows} from '@/client/components/card/signedGainRows';
import {CardRenderSymbolType} from '@/common/cards/render/CardRenderSymbolType';
import {ItemType} from '@/common/cards/render/Types';
import {Size} from '@/common/cards/render/Size';

const minus = {is: 'symbol', type: CardRenderSymbolType.MINUS, size: Size.MEDIUM, isIcon: true} as ItemType;
const plus = {is: 'symbol', type: CardRenderSymbolType.PLUS, size: Size.MEDIUM, isIcon: true} as ItemType;
const temperature = {is: 'item', type: 'temperature', amount: 2} as ItemType;
const titanium = {is: 'item', type: 'titanium', amount: 4} as ItemType;
const plants = {is: 'item', type: 'plants', amount: 4, anyPlayer: true} as ItemType;

describe('signedGainRows', () => {
  it('puts a plus before the resource row when another row takes resources', () => {
    expect(signGainRows([[temperature], [titanium], [minus, plants]])).deep.eq([[temperature], [plus, titanium], [minus, plants]]);
  });

  it('leaves cards without a loss alone', () => {
    expect(signGainRows([[temperature], [titanium]])).deep.eq([[temperature], [titanium]]);
  });
});
