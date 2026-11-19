import {expect} from 'chai';
import {Resource} from '../../src/common/Resource';
import {SeededRandom} from '../../src/common/utils/Random';
import {EXCHANGE_GOODS, FAVOUR_MAX, FAVOUR_MIN, bestRate, favourOf, worstRate} from '../../src/common/dune/smugglingExchange';
import {GOODS_FOR_GOODS_CAP, tradeRate} from '../../src/common/inputs/tradeRate';
import {EXCHANGE_VERSION, advanceExchange, currentRates, initializeExchange} from '../../src/server/dune/SmugglingExchange';
import {mayBuyFromGuild, maySellToGuild, recordRoundTrip} from '../../src/server/dune/guildRoundTrip';
import {SmugglingData, exchangeOf, initializeSmuggling} from '../../src/server/dune/Smuggling';

// Guild variant D (Jens 19 Nov 2026): the guild was a money pump (29 steel -> 1,760 M€ in two generations).
describe('Guild variant D', () => {
  it('keeps every rate within favour -1 ... +3 over many generations', () => {
    expect([FAVOUR_MIN, FAVOUR_MAX]).deep.eq([-1, 3]);
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new SeededRandom(seed);
      const data = initializeExchange(rng);
      for (let generation = 1; generation <= 14; generation++) {
        if (generation > 1) {
          advanceExchange(data, rng);
        }
        const sell = currentRates(data.sell);
        const buy = currentRates(data.buy);
        for (const good of EXCHANGE_GOODS) {
          expect(sell[good]).within(worstRate('sell', good), bestRate('sell', good));
          expect(buy[good]).within(bestRate('buy', good), worstRate('buy', good));
          expect(favourOf('sell', good, sell[good])).within(FAVOUR_MIN, FAVOUR_MAX);
          expect(favourOf('buy', good, buy[good])).within(FAVOUR_MIN, FAVOUR_MAX);
        }
      }
    }
  });

  it('caps goods for goods at twice the normal rate: steel sold for 5, energy bought for 1 gives 1 steel for 2 energy', () => {
    const pricing = {values: {[Resource.STEEL]: 5}, buyValues: {[Resource.ENERGY]: 1}};
    expect(GOODS_FOR_GOODS_CAP).eq(2);
    expect(tradeRate(pricing, Resource.STEEL, Resource.ENERGY)).deep.eq({give: 1, get: 2});
  });

  it('leaves trades for M€ and the black market uncapped', () => {
    expect(tradeRate({values: {[Resource.HEAT]: 4}, buyValues: {[Resource.MEGACREDITS]: 1}}, Resource.HEAT, Resource.MEGACREDITS)).deep.eq({give: 1, get: 4});
    // black market (values with factor): no cap, 2 heat for 1 plant
    expect(tradeRate({values: {[Resource.HEAT]: 1, [Resource.PLANTS]: 1}, factor: 2}, Resource.HEAT, Resource.PLANTS)).deep.eq({give: 2, get: 1});
  });

  it('blocks trading there and back in this and the next generation, energy and heat as one good', () => {
    let record = recordRoundTrip(undefined, 'p-1', 3, Resource.MEGACREDITS, Resource.ENERGY);
    expect(maySellToGuild(record, 'p-1', 3, Resource.ENERGY)).is.false;
    expect(maySellToGuild(record, 'p-1', 3, Resource.HEAT)).is.false;
    expect(maySellToGuild(record, 'p-1', 4, Resource.HEAT)).is.false;
    expect(maySellToGuild(record, 'p-1', 5, Resource.HEAT)).is.true;
    expect(maySellToGuild(record, 'p-2', 4, Resource.HEAT)).is.true;
    // a trade in generation 4 keeps generation 3 as the previous one
    record = recordRoundTrip(record, 'p-1', 4, Resource.STEEL, Resource.MEGACREDITS);
    expect(maySellToGuild(record, 'p-1', 4, Resource.HEAT)).is.false;
    expect(mayBuyFromGuild(record, 'p-1', 5, Resource.STEEL)).is.false;
    expect(maySellToGuild(record, 'p-1', 5, Resource.HEAT)).is.true;
    // a gap of a generation drops the old entries
    record = recordRoundTrip(record, 'p-1', 7, Resource.PLANTS, Resource.MEGACREDITS);
    expect(record.previous).is.undefined;
    expect(mayBuyFromGuild(record, 'p-1', 7, Resource.STEEL)).is.true;
  });

  it('moves old games onto version 3 and caps open prophecies the narrower exchange never reaches', () => {
    const data: SmugglingData = initializeSmuggling();
    const exchange = initializeExchange();
    exchange.version = 2;
    data.exchange = exchange;
    data.prophecy = {orders: [
      {id: 1, player: 'p-1', side: 'sell', good: Resource.HEAT, amount: 3, limit: 5, exact: true},
      {id: 2, player: 'p-1', side: 'buy', good: Resource.STEEL, amount: 3, limit: 0, exact: true},
    ], nextId: 3};
    exchangeOf(data);
    expect(data.exchange?.version).eq(EXCHANGE_VERSION);
    expect(data.prophecy.orders.map((order) => order.limit)).deep.eq([bestRate('sell', Resource.HEAT), bestRate('buy', Resource.STEEL)]);
  });
});
