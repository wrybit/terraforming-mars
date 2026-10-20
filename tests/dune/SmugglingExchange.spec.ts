import {expect} from 'chai';
import {SeededRandom} from '../../src/common/utils/Random';
import {EXCHANGE_GOODS, ExchangePrices, MAX_DEVIATION, NORMAL_BUY, NORMAL_SELL} from '../../src/common/dune/smugglingExchange';
import {ExchangeData, advanceExchange, initializeExchange} from '../../src/server/dune/SmugglingExchange';

function deviationSum(prices: ExchangePrices, normal: Readonly<ExchangePrices>): number {
  return EXCHANGE_GOODS.reduce((sum, good) => sum + prices[good] - normal[good], 0);
}

function run(seed: number, generations: number): ExchangeData {
  const data = initializeExchange();
  const rng = new SeededRandom(seed);
  for (let generation = 0; generation < generations; generation++) {
    advanceExchange(data, rng);
  }
  return data;
}

describe('Smuggling exchange', () => {
  it('starts at the normal rates', () => {
    const data = initializeExchange();
    expect(data.sell).deep.eq([NORMAL_SELL]);
    expect(data.buy).deep.eq([NORMAL_BUY]);
  });

  it('never runs away: fixed basket, at most 2 off, at least 1, selling never above buying, Solari at 1', () => {
    for (const seed of [0.1, 0.42, 0.77]) {
      const data = run(seed, 300);
      data.sell.forEach((sell, generation) => {
        const buy = data.buy[generation];
        expect(deviationSum(sell, NORMAL_SELL)).eq(0);
        expect(deviationSum(buy, NORMAL_BUY)).eq(0);
        expect([sell.megacredits, buy.megacredits]).deep.eq([1, 1]);
        for (const good of EXCHANGE_GOODS) {
          expect(Math.abs(sell[good] - NORMAL_SELL[good])).lte(MAX_DEVIATION);
          expect(Math.abs(buy[good] - NORMAL_BUY[good])).lte(MAX_DEVIATION);
          expect(sell[good]).gte(1);
          expect(sell[good]).lte(buy[good]);
        }
      });
    }
  });

  it('moves a little every generation, rarely by 2', () => {
    const data = run(0.31, 600);
    let moved = 0;
    let jumps = 0;
    for (let generation = 1; generation < data.buy.length; generation++) {
      const steps = EXCHANGE_GOODS.map((good) => Math.abs(data.buy[generation][good] - data.buy[generation - 1][good]));
      if (steps.some((step) => step > 0)) {
        moved++;
      }
      if (steps.some((step) => step === 2)) {
        jumps++;
      }
    }
    expect(moved / 600).gt(0.8);
    expect(jumps / 600).within(0.03, 0.3);
  });

  it('is the same for the same seed (replays and the AI see the same rates)', () => {
    expect(run(0.5, 20)).deep.eq(run(0.5, 20));
  });
});
