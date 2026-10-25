import {Resource} from '../Resource';
import {ExchangeSide, NORMAL_BUY, NORMAL_SELL, bestRate} from './smugglingExchange';

// Prophecy since 25 Oct 2026 (Jens; _mockups/dune/choam/prophezeiung-rechner.html). Shared by server (placing and
// settling orders) and client (the sum and the chart of the prophecy tab), so both always show the same numbers.
// - The limit is fixed: the first rate better than normal (selling normal + 1, buying normal − 1). The prophecy comes
//   true as soon as the market turns in the player's favour.
// - Selling: a number of units (2 to 8); comes true at rate r ≥ normal + 1 and brings units × r Solari plus the full
//   bet premium, 1 Solari per unit.
// - Buying: a budget, as many Solari as the units cost at the normal rate; comes true at rate r ≤ normal − 1 and
//   brings budget ÷ r units plus the full bet premium (1 Solari per unit, converted at r), each rounded up: there are
//   only whole units.

export const PROPHECY_MIN_UNITS = 2;
export const PROPHECY_MAX_UNITS = 8;

/** The fixed limit: one step better than normal */
export function prophecyLimit(side: ExchangeSide, good: Resource): number {
  return side === 'sell' ? NORMAL_SELL[good] + 1 : Math.max(1, NORMAL_BUY[good] - 1);
}

/** What a buy prophecy for `units` binds: the Solari these units cost at the normal rate */
export function prophecyBudget(good: Resource, units: number): number {
  return units * NORMAL_BUY[good];
}

/** Bet premium in Solari: the full premium, 1 Solari per unit (the distance of the limit from normal) */
export function prophecyPremium(units: number): number {
  return units;
}

export function prophecyComesTrue(side: ExchangeSide, good: Resource, rate: number): boolean {
  return side === 'sell' ? rate >= prophecyLimit(side, good) : rate <= prophecyLimit(side, good);
}

/**
 * The three parts of what the prophecy brings at `rate`, in Solari (selling) or units of the good (buying): what the
 * normal rate would give, what the rate adds, the premium. Undefined while the rate does not reach the limit.
 */
export type ProphecyOutcome = {base: number, market: number, premium: number, total: number};

export function prophecyOutcome(side: ExchangeSide, good: Resource, units: number, rate: number): ProphecyOutcome | undefined {
  if (!prophecyComesTrue(side, good, rate)) {
    return undefined;
  }
  if (side === 'sell') {
    const base = units * NORMAL_SELL[good];
    const market = units * rate - base;
    const premium = prophecyPremium(units);
    return {base, market, premium, total: base + market + premium};
  }
  const bought = Math.ceil(prophecyBudget(good, units) / rate);
  const premium = Math.ceil(prophecyPremium(units) / rate);
  return {base: units, market: bought - units, premium, total: bought + premium};
}

/** The rates the guild can set for a good, worst first and best last (the x axis of the chart) */
export function prophecyRates(side: ExchangeSide, good: Resource): Array<number> {
  const rates: Array<number> = [];
  if (side === 'sell') {
    for (let rate = Math.max(1, NORMAL_SELL[good] - 2); rate <= bestRate('sell', good); rate++) {
      rates.push(rate);
    }
  } else {
    for (let rate = NORMAL_BUY[good] + 2; rate >= bestRate('buy', good); rate--) {
      rates.push(rate);
    }
  }
  return rates;
}
