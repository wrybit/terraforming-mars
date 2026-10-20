import {Resource} from '../Resource';
import {TradePairRate, TradeRate} from '../models/PlayerInputModel';

// Exchange rate of a trade (SelectTrade), shared by server (checks the answer) and client (shows and builds it), so
// both always compute the same amounts.

/** How a trade is priced: a fixed rate for every pair, or the worth of each resource times a factor */
export type TradePricing = {
  /** Same rate for every pair (moving spice: 1 spice for 5 M€) */
  rate?: TradeRate,
  /** Worth of one unit per resource (black market: the value table of the Dune expansion) */
  values?: Partial<Record<Resource, number>>,
  /** With values: the given side is worth this many times the received one (black market: 2) */
  factor?: number,
  /**
   * Price of one received unit per resource (smuggling exchange: the buy board); `values` then is what one given unit
   * brings (the sell board) and `factor` is not used
   */
  buyValues?: Partial<Record<Resource, number>>,
  /** Pairs with their own rate and limit (smuggling: 1 spice for 5 M€, at most 5) */
  pairs?: ReadonlyArray<TradePairRate>,
};

function pairOf(pricing: TradePricing, give: Resource, get: Resource): TradePairRate | undefined {
  return pricing.pairs?.find((pair) => pair.give === give && pair.get === get);
}

/** Most of `give` this pair allows (its own limit), or undefined: only the stock limits it */
export function pairGiveLimit(pricing: TradePricing, give: Resource, get: Resource): number | undefined {
  return pairOf(pricing, give, get)?.maxGive;
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

/**
 * Rate for giving `give` and getting `get`: whole numbers, as small as possible. With values, `factor` times the worth
 * of what is received is paid (e.g. worth 1 M€, 3 spice, factor 2: 6 M€ for 1 spice; 2 spice for 3 M€).
 * Undefined for a free trade (CHOAM offer) or a resource without a worth.
 */
export function tradeRate(pricing: TradePricing, give: Resource, get: Resource): TradeRate | undefined {
  const pair = pairOf(pricing, give, get);
  if (pair !== undefined) {
    return pair.rate;
  }
  if (pricing.rate !== undefined) {
    return pricing.rate;
  }
  const giveWorth = pricing.values?.[give];
  const getWorth = pricing.buyValues !== undefined ? pricing.buyValues[get] : pricing.values?.[get];
  if (giveWorth === undefined || getWorth === undefined) {
    return undefined;
  }
  const giveUnits = (pricing.buyValues !== undefined ? 1 : (pricing.factor ?? 1)) * getWorth;
  const getUnits = giveWorth;
  const divisor = greatestCommonDivisor(giveUnits, getUnits);
  return {give: giveUnits / divisor, get: getUnits / divisor};
}

/** Whether the trade is priced at all (fixed rate or values) – otherwise both amounts are free */
export function isPricedTrade(pricing: TradePricing): boolean {
  return pricing.rate !== undefined || pricing.values !== undefined;
}
