import {expect} from 'chai';
import {SelectTrade, Trade} from '../../src/server/inputs/SelectTrade';
import {Resource} from '../../src/common/Resource';
import {quickTradeResponse, randomTradeResponse} from '../../src/server/ai/tradeResponse';
import {tradeRate} from '../../src/common/inputs/tradeRate';

describe('SelectTrade', () => {
  function input(rate?: {give: number, get: number}): {trade: SelectTrade, done: Array<Trade>} {
    const done: Array<Trade> = [];
    const trade = new SelectTrade('Trade', 'Trade',
      [{resource: Resource.HEAT, max: 9}, {resource: Resource.STEEL, max: 3}], [Resource.HEAT, Resource.PLANTS, Resource.STEEL], rate === undefined ? 10 : 99, rate === undefined ? {} : {rate})
      .andThen((chosen) => {
        done.push(chosen);
        return undefined;
      });
    return {trade, done};
  }

  it('derives the rate of a pair from the worth of both resources', () => {
    const pricing = {values: {megacredits: 1, steel: 2, titanium: 3}, factor: 2};
    expect(tradeRate(pricing, Resource.MEGACREDITS, Resource.TITANIUM)).deep.eq({give: 6, get: 1});
    expect(tradeRate(pricing, Resource.TITANIUM, Resource.MEGACREDITS)).deep.eq({give: 2, get: 3});
    expect(tradeRate(pricing, Resource.STEEL, Resource.TITANIUM)).deep.eq({give: 3, get: 1});
    expect(tradeRate({}, Resource.STEEL, Resource.TITANIUM)).is.undefined;
  });

  it('hands the chosen trade to its callback', () => {
    const {trade, done} = input();
    trade.process({type: 'trade', give: Resource.STEEL, giveAmount: 3, get: Resource.PLANTS, getAmount: 7});
    expect(done).deep.eq([{give: Resource.STEEL, giveAmount: 3, get: Resource.PLANTS, getAmount: 7}]);
  });

  it('rejects a resource that is not offered and getting the given resource', () => {
    const {trade} = input();
    expect(() => trade.process({type: 'trade', give: Resource.PLANTS, giveAmount: 1, get: Resource.HEAT, getAmount: 1})).to.throw();
    expect(() => trade.process({type: 'trade', give: Resource.HEAT, giveAmount: 1, get: Resource.HEAT, getAmount: 1})).to.throw();
    expect(() => trade.process({type: 'trade', give: Resource.HEAT, giveAmount: 0, get: Resource.PLANTS, getAmount: 1})).to.throw();
  });

  it('builds valid AI answers, with and without a rate', () => {
    for (const rate of [undefined, {give: 2, get: 1}]) {
      for (let seed = 0; seed < 20; seed++) {
        const {trade} = input(rate);
        let state = seed + 1;
        const random = () => {
          state = (state * 9301 + 49297) % 233280;
          return state / 233280;
        };
        trade.process(randomTradeResponse(trade, random));
      }
      const {trade, done} = input(rate);
      trade.process(quickTradeResponse(trade));
      expect(done).has.length(1);
    }
    const {trade, done} = input({give: 2, get: 1});
    trade.process(quickTradeResponse(trade));
    expect(done[0]).deep.eq({give: Resource.HEAT, giveAmount: 8, get: Resource.PLANTS, getAmount: 4});
  });
});
