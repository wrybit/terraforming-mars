import {Random} from '../../common/utils/Random';
import {EXCHANGE_GOODS, ExchangeGood, ExchangePrices, MAX_DEVIATION, NORMAL_BUY, NORMAL_SELL} from '../../common/dune/smugglingExchange';

// Rates of the smuggling exchange (common/dune/smugglingExchange.ts) and how they move from one generation to the next,
// so they swing a little but never run away (Jens, 20 Oct 2026):
// - Fixed basket: per board one rate rises by 1 and another falls by 1; the deviations from the normal rates always
//   add up to 0. About one generation in six brings a jump: one rate ±2, two others ∓1.
// - Guard rails: at most 2 away from the normal rate, never below 1, and selling never above buying the same good
//   (trading there and back never pays).
// - Pull to the middle: the further a rate is from normal, the likelier it moves back.

export type ExchangeData = {
  /** Rates per generation, the current one last */
  sell: Array<ExchangePrices>,
  buy: Array<ExchangePrices>,
};

/** About one generation in six brings a jump */
const JUMP_CHANCE = 1 / 6;

export function initializeExchange(): ExchangeData {
  return {sell: [{...NORMAL_SELL}], buy: [{...NORMAL_BUY}]};
}

export function currentRates(rates: ReadonlyArray<ExchangePrices>): ExchangePrices {
  return rates[rates.length - 1];
}

/** Weighted pick; weights of 0 or less are left out */
function pick<T>(items: ReadonlyArray<T>, weight: (item: T) => number, rng: Random): T | undefined {
  const weighted = items.map((item) => ({item, weight: weight(item)})).filter((entry) => entry.weight > 0);
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total === 0) {
    return undefined;
  }
  let roll = rng.next() * total;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll < 0) {
      return entry.item;
    }
  }
  return weighted[weighted.length - 1].item;
}

/** One try of the given steps, each good chosen weighted towards the normal rate; undefined when a step finds no good */
function tryMoves(prices: ExchangePrices, normal: Readonly<ExchangePrices>, steps: ReadonlyArray<number>,
  allowed: (good: ExchangeGood, rate: number) => boolean, rng: Random): ExchangePrices | undefined {
  const next = {...prices};
  const used = new Set<ExchangeGood>();
  for (const step of steps) {
    const good = pick(EXCHANGE_GOODS.filter((candidate) => !used.has(candidate) && allowed(candidate, next[candidate] + step)),
      // Rising is likelier below normal, falling likelier above it
      (candidate) => MAX_DEVIATION + 1 - Math.sign(step) * (next[candidate] - normal[candidate]), rng);
    if (good === undefined) {
      return undefined;
    }
    used.add(good);
    next[good] += step;
  }
  return next;
}

/** Tries before a jump falls back to a normal move, and a normal move to standing still */
const TRIES = 8;

/**
 * One generation further on one board. `allowed(good, rate)` says whether a rate is possible (bounds and the other
 * board). A jump that does not fit becomes a normal move; only if nothing fits the board stays as it was.
 */
function moveBoard(prices: ExchangePrices, normal: Readonly<ExchangePrices>, allowed: (good: ExchangeGood, rate: number) => boolean,
  rng: Random): ExchangePrices {
  const sign = rng.next() < 0.5 ? 1 : -1;
  // Normal: +1 and −1. Jump: ±2 against twice ∓1 or against one ∓2 – the deviations always keep their sum
  const plans = rng.next() < JUMP_CHANCE ? [[2 * sign, -sign, -sign], [2 * sign, -2 * sign], [1, -1]] : [[1, -1]];
  for (const steps of plans) {
    for (let attempt = 0; attempt < TRIES; attempt++) {
      const next = tryMoves(prices, normal, steps, allowed, rng);
      if (next !== undefined) {
        return next;
      }
    }
  }
  return {...prices};
}

/** End of a generation: both boards move on; buying first, then selling stays below it */
export function advanceExchange(data: ExchangeData, rng: Random): void {
  const sell = currentRates(data.sell);
  const buy = currentRates(data.buy);
  const inBounds = (normal: Readonly<ExchangePrices>, good: ExchangeGood, rate: number) =>
    rate >= 1 && Math.abs(rate - normal[good]) <= MAX_DEVIATION;
  const nextBuy = moveBoard(buy, NORMAL_BUY, (good, rate) => inBounds(NORMAL_BUY, good, rate) && rate >= sell[good], rng);
  const nextSell = moveBoard(sell, NORMAL_SELL, (good, rate) => inBounds(NORMAL_SELL, good, rate) && rate <= nextBuy[good], rng);
  data.buy.push(nextBuy);
  data.sell.push(nextSell);
}
