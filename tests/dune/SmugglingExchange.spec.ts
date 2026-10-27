import {expect} from 'chai';
import {SeededRandom} from '../../src/common/utils/Random';
import {
  EXCHANGE_GOODS, FAVOUR_MAX, FAVOUR_MIN, MARKET_MAX, MARKET_MIN, NORMAL_BUY, NORMAL_SELL,
  bestRate, favourOf, orderLimits, orderPremium, orderRefund,
  privilegePay, privilegeRate,
} from '../../src/common/dune/smugglingExchange';
import {
  EXCHANGE_VERSION, ExchangeData, MAX_SAME_GENERATIONS, advanceExchange, forecastOf, initializeExchange, migrateExchange, recordTrade,
} from '../../src/server/dune/SmugglingExchange';

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
    expect(data.version).eq(EXCHANGE_VERSION);
    expect(data.market).deep.eq([0]);
    expect(data.next).is.not.undefined;
    expect(Math.abs(data.next?.market ?? 9)).eq(1);
    // Without a random source (old games) at the normal rates
    expect(initializeExchange().sell).deep.eq([NORMAL_SELL]);
  });

  it('keeps the normal rates of the game (Jens 27 Oct 2026: only how the rates move changes)', () => {
    expect(NORMAL_SELL).deep.eq({megacredits: 1, steel: 2, titanium: 5, plants: 1, energy: 1, heat: 1});
    expect(NORMAL_BUY).deep.eq({megacredits: 1, steel: 4, titanium: 6, plants: 2, energy: 2, heat: 2});
  });

  it('keeps every rate within −2 … +4 in the player\'s favour and at least 1 Solari; selling may stand above buying', () => {
    let crossed = 0;
    for (const seed of [0.1, 0.42, 0.77]) {
      const data = run(seed, 300);
      data.sell.forEach((sell, generation) => {
        const buy = data.buy[generation];
        expect([sell.megacredits, buy.megacredits]).deep.eq([1, 1]);
        for (const good of EXCHANGE_GOODS) {
          expect(favourOf('sell', good, sell[good])).within(FAVOUR_MIN, FAVOUR_MAX);
          expect(favourOf('buy', good, buy[good])).within(FAVOUR_MIN, FAVOUR_MAX);
          expect(sell[good]).gte(1);
          expect(buy[good]).gte(1);
          if (sell[good] > buy[good]) {
            crossed++;
          }
        }
      });
    }
    expect(crossed).gt(0);
  });

  it('follows the target distribution where 1 Solari does not cut it: spice sells for 3 to 9', () => {
    const counts: Record<number, number> = {};
    let cells = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const data = run(seed / 301, 14);
      data.sell.slice(1).forEach((sell) => {
        const favour = favourOf('sell', 'titanium', sell.titanium);
        counts[favour] = (counts[favour] ?? 0) + 1;
        cells++;
      });
    }
    const share = (favour: number) => 100 * (counts[favour] ?? 0) / cells;
    // Target 12 / 22 / 26 / 18 / 10 / 7 / 5 %
    expect(share(0)).within(18, 32);
    expect(share(-2)).within(6, 18);
    expect(share(4)).within(2, 9);
  });

  it('turns the forecast into the rates of the next generation', () => {
    const rng = new SeededRandom(0.6);
    const data = initializeExchange(rng);
    const forecast = data.next;
    advanceExchange(data, rng);
    expect(data.sell[1]).deep.eq(forecast?.sell);
    expect(data.buy[1]).deep.eq(forecast?.buy);
    expect(data.market?.[1]).eq(forecast?.market);
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

  it('moves the market mood 1 per generation within −2 … +2', () => {
    const data = run(0.27, 200);
    const market = data.market ?? [];
    expect(market).has.length(201);
    for (let generation = 1; generation < market.length; generation++) {
      expect(Math.abs(market[generation] - market[generation - 1])).eq(1);
      expect(market[generation]).within(MARKET_MIN, MARKET_MAX);
    }
  });

  it('draws the steps below 1 Solari as well: water sells for 1 more often, not more often higher (Jens 27 Oct 2026)', () => {
    let atOne = 0;
    let atFive = 0;
    let cells = 0;
    for (let seed = 1; seed <= 300; seed++) {
      run(seed / 301, 14).sell.slice(1).forEach((sell) => {
        atOne += sell.heat === 1 ? 1 : 0;
        atFive += sell.heat === 5 ? 1 : 0;
        cells++;
      });
    }
    // Target: −2, −1 and 0 together 60 %, +4 5 %
    expect(100 * atOne / cells).within(52, 68);
    expect(100 * atFive / cells).within(2, 9);
  });

  it('never keeps a rate the same longer than 2 generations, except on 1 Solari (Jens 27 Oct 2026)', () => {
    for (const seed of [0.13, 0.58, 0.91]) {
      const data = run(seed, 200);
      for (const side of ['sell', 'buy'] as const) {
        for (const good of EXCHANGE_GOODS) {
          let same = 1;
          for (let generation = 1; generation < data[side].length; generation++) {
            const rate = data[side][generation][good];
            same = rate === data[side][generation - 1][good] && rate !== 1 ? same + 1 : 1;
            expect(same, `${side} ${good} generation ${generation}`).lte(MAX_SAME_GENERATIONS);
          }
        }
      }
    }
  });

  it('gives games from before the market mood one, rates unchanged', () => {
    const data: ExchangeData = {sell: [{...NORMAL_SELL, steel: 3}], buy: [{...NORMAL_BUY}]};
    expect(migrateExchange(data)).eq('added');
    expect(data.sell[0].steel).eq(3);
    expect(data.market).deep.eq([0]);
    expect(migrateExchange(data)).is.undefined;
  });

  it('moves games from the doubled normal rates back, keeping each favour as far as 1 Solari allows', () => {
    const data: ExchangeData = {
      sell: [{megacredits: 1, steel: 5, titanium: 8, plants: 1, energy: 4, heat: 3}],
      buy: [{megacredits: 1, steel: 9, titanium: 14, plants: 8, energy: 3, heat: 7}],
      market: [1],
    };
    expect(migrateExchange(data)).eq('doubled');
    expect(data.sell[0]).deep.eq({megacredits: 1, steel: 3, titanium: 3, plants: 1, energy: 2, heat: 1});
    expect(data.buy[0]).deep.eq({megacredits: 1, steel: 4, titanium: 5, plants: 3, energy: 1, heat: 2});
    expect(data.version).eq(EXCHANGE_VERSION);
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
    expect(bestRate('sell', 'titanium')).eq(9);
    expect(orderLimits('buy', 'steel')).deep.eq({min: 1, max: 3});
    expect(orderPremium('sell', 'titanium', 3, 7)).eq(6);
    expect(orderPremium('buy', 'steel', 3, 2)).eq(0);
    expect(orderRefund(5)).eq(2);
  });

  it('lets the emperor pay 1 more than the guild, never less than normal + 1 (Jens 25 Oct 2026)', () => {
    // Plasteel: normal 2; guild 3 -> 4, guild 2 -> 3, guild 1 -> still 3
    expect([privilegeRate('steel', 3), privilegeRate('steel', 2), privilegeRate('steel', 1)]).deep.eq([4, 3, 3]);
    expect(privilegePay('steel', 5, 3)).eq(20);
  });
});
