import {expect} from 'chai';
import {testGame} from '../TestGame';
import {isStockAward} from '../../src/server/ai/stockAward';
import {Miner} from '../../src/server/awards/Miner';
import {Thermalist} from '../../src/server/awards/Thermalist';
import {Landlord} from '../../src/server/awards/Landlord';
import {Banker} from '../../src/server/awards/Banker';

describe('AI stock awards', () => {
  it('tells awards for a resource stock from awards for tiles or production', () => {
    const [, player] = testGame(2);
    expect(isStockAward(new Miner(), player)).is.true;
    expect(isStockAward(new Thermalist(), player)).is.true;
    expect(isStockAward(new Landlord(), player)).is.false;
    expect(isStockAward(new Banker(), player)).is.false;
    // The test leaves the stock as it was.
    expect(player.steel).eq(0);
  });
});
