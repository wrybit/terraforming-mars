import {expect} from 'chai';
import {SeededRandom} from '../../src/common/utils/Random';
import {
  EXCHANGE_GOODS, ExchangePrices, ExchangeSide, FAVOUR_MAX, FAVOUR_MIN, FAVOUR_SUM_MAX, FAVOUR_SUM_MIN, NORMAL_BUY, NORMAL_SELL,
  bestRate, favourOf, orderLimits, orderPremium, orderRefund,
} from '../../src/common/dune/smugglingExchange';
import {ExchangeData, advanceExchange, forecastOf, initializeExchange, recordTrade} from '../../src/server/dune/SmugglingExchange';

function favourSum(side: ExchangeSide, prices: ExchangePrices): number {
  return EXCHANGE_GOODS.reduce((sum, good) => sum + favourOf(side, good, prices[good]), 0);
}

function run(seed: number, generations: number): ExchangeData {
  const rng = new SeededRandom(seed);
  const data = initializeExchange(rng);
  for (let generation = 0; generation < generations; generation++) {
    advanceExchange(data, rng);
  }
  return data;
}

describe('CHOAM exchange', () => {
  it('starts at the normal rates, with the forecast of the next generation', () => {
    const data = initializeExchange(new SeededRandom(0.3));
    expect(data.sell).deep.eq([NORMAL_SELL]);
    expect(data.buy).deep.eq([NORMAL_BUY]);
    expect(data.next).is.not.undefined;
  });

  it('keeps every rate within −2 … +4 in the player\'s favour, the sum within 0 … +2, at least 1, selling never above buying', () => {
    for (const seed of [0.1, 0.42, 0.77]) {
      const data = run(seed, 300);
      data.sell.forEach((sell, generation) => {
        const buy = data.buy[generation];
        expect(favourSum('sell', sell)).within(FAVOUR_SUM_MIN, FAVOUR_SUM_MAX);
        expect(favourSum('buy', buy)).within(FAVOUR_SUM_MIN, FAVOUR_SUM_MAX);
        expect([sell.megacredits, buy.megacredits]).deep.eq([1, 1]);
        for (const good of EXCHANGE_GOODS) {
          expect(favourOf('sell', good, sell[good])).within(FAVOUR_MIN, FAVOUR_MAX);
          expect(favourOf('buy', good, buy[good])).within(FAVOUR_MIN, FAVOUR_MAX);
          expect(sell[good]).gte(1);
          expect(sell[good]).lte(buy[good]);
        }
      });
    }
  });

  it('turns the forecast into the rates of the next generation', () => {
    const rng = new SeededRandom(0.6);
    const data = initializeExchange(rng);
    const forecast = data.next;
    advanceExchange(data, rng);
    expect(data.sell[1]).deep.eq(forecast?.sell);
    expect(data.buy[1]).deep.eq(forecast?.buy);
  });

  it('gives games from before the forecast one at their next generation end', () => {
    const data = initializeExchange();
    advanceExchange(data, new SeededRandom(0.2));
    expect(data.sell).has.length(2);
    expect(data.next).is.not.undefined;
  });

  it('moves every generation and now and then reaches a peak of 3 or more', () => {
    const data = run(0.31, 600);
    let moved = 0;
    let peaks = 0;
    for (let generation = 1; generation < data.buy.length; generation++) {
      if (EXCHANGE_GOODS.some((good) => data.buy[generation][good] !== data.buy[generation - 1][good])) {
        moved++;
      }
      if (EXCHANGE_GOODS.some((good) => favourOf('sell', good, data.sell[generation][good]) >= 3)) {
        peaks++;
      }
    }
    expect(moved / 600).gt(0.8);
    expect(peaks).gt(0);
  });

  it('is the same for the same seed (replays and the AI see the same rates)', () => {
    expect(run(0.5, 20)).deep.eq(run(0.5, 20));
  });

  it('moves the forecast by supply and demand: every 3 sold net lower selling, every 3 bought raise buying', () => {
    const rng = new SeededRandom(0.4);
    const data = initializeExchange(rng);
    data.next = {sell: {...NORMAL_SELL}, buy: {...NORMAL_BUY}};
    // 7 spice sold, 1 bought back: 6 net → selling 2 lower; 3 water bought → buying 1 higher
    recordTrade(data, 'titanium', 7, 'megacredits', 35);
    recordTrade(data, 'megacredits', 6, 'titanium', 1);
    recordTrade(data, 'megacredits', 6, 'heat', 3);
    const forecast = forecastOf(data);
    expect(forecast?.sell.titanium).eq(NORMAL_SELL.titanium - 2);
    expect(forecast?.buy.heat).eq(NORMAL_BUY.heat + 1);
    expect(forecast?.sell.steel).eq(NORMAL_SELL.steel);
    // Never beyond 2 against the player, never below 1
    recordTrade(data, 'plants', 30, 'megacredits', 30);
    expect(forecastOf(data)?.sell.plants).eq(1);
    // The next generation takes the moved rates and starts counting anew
    advanceExchange(data, rng);
    expect(data.sell[1].titanium).eq(NORMAL_SELL.titanium - 2);
    expect(data.flow).is.undefined;
  });

  it('prices prophecies: limits, bet premium for selling only, half back on withdrawing', () => {
    expect(orderLimits('sell', 'titanium')).deep.eq({min: 6, max: bestRate('sell', 'titanium')});
    expect(bestRate('sell', 'titanium')).eq(8);
    expect(orderLimits('buy', 'steel')).deep.eq({min: 1, max: 3});
    expect(orderPremium('sell', 'titanium', 3, 7)).eq(6);
    expect(orderPremium('buy', 'steel', 3, 2)).eq(0);
    expect(orderRefund(5)).eq(2);
  });
});
