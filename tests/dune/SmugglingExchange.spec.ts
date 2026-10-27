import {expect} from 'chai';
import {SeededRandom} from '../../src/common/utils/Random';
import {
  EXCHANGE_GOODS, ExchangePrices, ExchangeSide, FAVOUR_MAX, FAVOUR_MIN, MARKET_MAX, MARKET_MIN, NORMAL_BUY, NORMAL_SELL,
  bestRate, boardSumBand, favourOf, orderLimits, orderPremium, orderRefund,
  privilegePay, privilegeRate,
} from '../../src/common/dune/smugglingExchange';
import {
  ExchangeData, MAX_SAME_GENERATIONS, advanceExchange, forecastOf, initializeExchange, migrateExchange, recordTrade,
} from '../../src/server/dune/SmugglingExchange';

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
  it('starts with drawn rates at market mood 0, with the forecast of the next generation', () => {
    const data = initializeExchange(new SeededRandom(0.3));
    expect(data.sell).has.length(1);
    expect(data.market).deep.eq([0]);
    expect(favourSum('sell', data.sell[0])).within(boardSumBand(0).min, boardSumBand(0).max);
    expect(data.next).is.not.undefined;
    expect(Math.abs(data.next?.market ?? 9)).eq(1);
    // Without a random source (old games) at the normal rates
    expect(initializeExchange().sell).deep.eq([NORMAL_SELL]);
  });

  it('keeps every rate within −2 … +4 in the player\'s favour, at least 1, selling never above buying, the sum mostly in the band of the market mood', () => {
    for (const seed of [0.1, 0.42, 0.77]) {
      const data = run(seed, 300);
      let inBand = 0;
      data.sell.forEach((sell, generation) => {
        const buy = data.buy[generation];
        const band = boardSumBand(data.market?.[generation] ?? 0);
        // The band moves 2 with every step of the mood; the rates follow within a generation or two
        for (const sum of [favourSum('sell', sell), favourSum('buy', buy)]) {
          if (sum >= band.min && sum <= band.max) {
            inBand++;
          }
        }
        expect([sell.megacredits, buy.megacredits]).deep.eq([1, 1]);
        for (const good of EXCHANGE_GOODS) {
          expect(favourOf('sell', good, sell[good])).within(FAVOUR_MIN, FAVOUR_MAX);
          expect(favourOf('buy', good, buy[good])).within(FAVOUR_MIN, FAVOUR_MAX);
          expect(sell[good]).gte(1);
          expect(sell[good]).lte(buy[good]);
        }
      });
      expect(inBand / (2 * data.sell.length)).gt(0.85);
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

  it('moves the market mood 1 per generation within −2 … +3', () => {
    const data = run(0.27, 200);
    const market = data.market ?? [];
    expect(market).has.length(201);
    for (let generation = 1; generation < market.length; generation++) {
      expect(Math.abs(market[generation] - market[generation - 1])).eq(1);
      expect(market[generation]).within(MARKET_MIN, MARKET_MAX);
    }
  });

  it('never keeps a rate the same longer than 2 generations (Jens 27 Oct 2026)', () => {
    for (const seed of [0.13, 0.58, 0.91]) {
      const data = run(seed, 200);
      for (const side of ['sell', 'buy'] as const) {
        for (const good of EXCHANGE_GOODS) {
          let same = 1;
          for (let generation = 1; generation < data[side].length; generation++) {
            same = data[side][generation][good] === data[side][generation - 1][good] ? same + 1 : 1;
            expect(same, `${side} ${good} generation ${generation}`).lte(MAX_SAME_GENERATIONS);
          }
        }
      }
    }
  });

  it('reaches +4 now and then', () => {
    const data = run(0.44, 600);
    const tops = data.sell.filter((sell) => EXCHANGE_GOODS.some((good) => favourOf('sell', good, sell[good]) === FAVOUR_MAX));
    expect(tops.length).gt(10);
  });

  it('moves games from before the market mood onto the new normal rates, keeping every favour', () => {
    const data: ExchangeData = {
      sell: [{megacredits: 1, steel: 3, titanium: 5, plants: 1, energy: 2, heat: 1}],
      buy: [{megacredits: 1, steel: 4, titanium: 5, plants: 3, energy: 2, heat: 2}],
    };
    expect(migrateExchange(data)).is.true;
    expect(data.sell[0]).deep.eq({megacredits: 1, steel: 5, titanium: 10, plants: 3, energy: 4, heat: 3});
    expect(data.buy[0]).deep.eq({megacredits: 1, steel: 9, titanium: 14, plants: 8, energy: 7, heat: 7});
    expect(data.market).deep.eq([0]);
    expect(migrateExchange(data)).is.false;
  });

  it('is the same for the same seed (replays and the AI see the same rates)', () => {
    expect(run(0.5, 20)).deep.eq(run(0.5, 20));
  });

  it('moves the forecast by supply and demand: every 3 sold net lower selling, every 3 bought raise buying', () => {
    const rng = new SeededRandom(0.4);
    const data = initializeExchange(rng);
    data.next = {sell: {...NORMAL_SELL}, buy: {...NORMAL_BUY}};
    // 7 spice sold, 1 bought back: 6 net → selling 2 lower; 3 water bought → buying 1 higher
    recordTrade(data, 'titanium', 7, 'megacredits', 70);
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
    expect(orderLimits('sell', 'titanium')).deep.eq({min: 11, max: bestRate('sell', 'titanium')});
    expect(bestRate('sell', 'titanium')).eq(14);
    expect(orderLimits('buy', 'steel')).deep.eq({min: 5, max: 8});
    expect(orderPremium('sell', 'titanium', 3, 12)).eq(6);
    expect(orderPremium('buy', 'steel', 3, 6)).eq(0);
    expect(orderRefund(5)).eq(2);
  });

  it('lets the emperor pay 1 more than the guild, never less than normal + 1 (Jens 25 Oct 2026)', () => {
    // Plasteel: normal 4; guild 5 -> 6, guild 4 -> 5, guild 3 -> still 5
    expect([privilegeRate('steel', 5), privilegeRate('steel', 4), privilegeRate('steel', 3)]).deep.eq([6, 5, 5]);
    expect(privilegePay('steel', 5, 5)).eq(30);
  });
});
