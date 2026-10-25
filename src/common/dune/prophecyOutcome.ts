import {Resource} from '../Resource';
import {ExchangeSide, NORMAL_BUY, NORMAL_RATES, NORMAL_SELL, bestRate} from './smugglingExchange';

// Prophecy since 25 Oct 2026, evening (Jens; _mockups/dune/choam/prophezeiung-layout.html). Shared by server (placing
// and settling orders) and client (the sum and the chart of the prophecy tab), so both always show the same numbers.
// - The player commits to an amount (2 to 8 units) and to one rate, the column of the chart: selling from normal + 1
//   up to the best rate, buying from normal − 1 down to the best rate.
// - The prophecy comes true when the rate of a new generation reaches that rate (or does better). It then brings
//   exactly its column, nothing more; until then it brings nothing. Withdrawing gives back half.
// - Selling: units × rate Solari plus the bet premium, units × (rate − normal).
// - Buying: a budget, as many Solari as the units cost at the normal rate; it brings budget ÷ rate units plus the
//   premium, units × (normal − rate) Solari converted at the rate, each rounded up: there are only whole units.

export const PROPHECY_MIN_UNITS = 2;
export const PROPHECY_MAX_UNITS = 8;

/** The rates a prophecy can name, the first better than normal first (the columns of the chart) */
export function prophecyRates(side: ExchangeSide, good: Resource): Array<number> {
  const rates: Array<number> = [];
  if (side === 'sell') {
    for (let rate = NORMAL_SELL[good] + 1; rate <= bestRate('sell', good); rate++) {
      rates.push(rate);
    }
  } else {
    for (let rate = Math.max(1, NORMAL_BUY[good] - 1); rate >= bestRate('buy', good); rate--) {
      rates.push(rate);
    }
  }
  return rates;
}

/** What a buy prophecy for `units` binds: the Solari these units cost at the normal rate */
export function prophecyBudget(good: Resource, units: number): number {
  return units * NORMAL_BUY[good];
}

/** Bet premium in Solari: per unit how far the named rate lies from normal */
export function prophecyPremium(side: ExchangeSide, good: Resource, units: number, rate: number): number {
  return units * Math.abs(rate - NORMAL_RATES[side][good]);
}

/** Whether the rate of a new generation reaches the named rate (or does better) */
export function prophecyComesTrue(side: ExchangeSide, named: number, rate: number): boolean {
  return side === 'sell' ? rate >= named : rate <= named;
}

/**
 * The column of a prophecy on `rate`: what the normal rate would give, what the rate adds, the premium and the sum,
 * in Solari (selling) or units of the good (buying).
 */
export type ProphecyOutcome = {base: number, market: number, premium: number, total: number};

export function prophecyOutcome(side: ExchangeSide, good: Resource, units: number, rate: number): ProphecyOutcome {
  const premiumSolari = prophecyPremium(side, good, units, rate);
  if (side === 'sell') {
    const base = units * NORMAL_SELL[good];
    const market = units * rate - base;
    return {base, market, premium: premiumSolari, total: base + market + premiumSolari};
  }
  const bought = Math.ceil(prophecyBudget(good, units) / rate);
  const premium = Math.ceil(premiumSolari / rate);
  return {base: units, market: bought - units, premium, total: bought + premium};
}
