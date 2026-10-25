import {Resource} from '../Resource';

// Exchange of the CHOAM module (Dune, Jens 20 and 24 Oct 2026; _mockups/dune/choam/choam-prototyp.html): two boards
// with rates in Solari per unit that change every generation. "Sell" is what the guild pays for what you give (high is
// good for you), "buy" what you pay for what you get (low is good for you). Solari themselves always stand at 1.
// Shared by server (rates, trades, orders) and client (the history and forecast above the resource tiles).

/** Resources with a rate that moves; Solari (M€) stay fixed at 1 */
export const EXCHANGE_GOODS = [Resource.STEEL, Resource.TITANIUM, Resource.PLANTS, Resource.ENERGY, Resource.HEAT] as const;
export type ExchangeGood = typeof EXCHANGE_GOODS[number];

export type ExchangeSide = 'sell' | 'buy';

export type ExchangePrices = Record<Resource, number>;

/** Normal rates: selling at the worth of the value table (spice at its smuggling price 5), buying at double worth */
export const NORMAL_SELL: Readonly<ExchangePrices> = {megacredits: 1, steel: 2, titanium: 5, plants: 1, energy: 1, heat: 1};
export const NORMAL_BUY: Readonly<ExchangePrices> = {megacredits: 1, steel: 4, titanium: 6, plants: 2, energy: 2, heat: 2};
export const NORMAL_RATES: Readonly<Record<ExchangeSide, Readonly<ExchangePrices>>> = {sell: NORMAL_SELL, buy: NORMAL_BUY};

// "Favour" of a rate: how far it lies from normal in the player's favour (selling higher, buying cheaper). Each rate
// may go up to 4 in the player's favour and 2 against; the favours of one board add up to 0 … 2, so the market as a
// whole leans a little towards the players, and chance decides where the surplus lands (Jens, 24 Oct 2026).
export const FAVOUR_MIN = -2;
export const FAVOUR_MAX = 4;
export const FAVOUR_SUM_MIN = 0;
export const FAVOUR_SUM_MAX = 2;
/** From this favour on a rate counts as a peak (the tile shows it highlighted) */
export const PEAK_FAVOUR = 3;

const SIGN: Readonly<Record<ExchangeSide, number>> = {sell: 1, buy: -1};

/** Favour of `rate` for `good` on one side: positive is good for the player */
export function favourOf(side: ExchangeSide, good: Resource, rate: number): number {
  return SIGN[side] * (rate - NORMAL_RATES[side][good]);
}

/** The rate `favour` steps away from normal in the player's favour */
export function rateAtFavour(side: ExchangeSide, good: Resource, favour: number): number {
  return NORMAL_RATES[side][good] + SIGN[side] * favour;
}

/** Best rate the exchange can reach; selling never rises above the highest buying price of the same good */
export function bestRate(side: ExchangeSide, good: Resource): number {
  if (side === 'sell') {
    return Math.min(NORMAL_SELL[good] + FAVOUR_MAX, NORMAL_BUY[good] - FAVOUR_MIN);
  }
  return Math.max(1, NORMAL_BUY[good] - FAVOUR_MAX);
}

/**
 * Limits a prophecy (order) may name: selling from one above normal up to the best rate, buying from the best rate up
 * to one below normal – an order at the normal rate or worse would be a plain trade
 */
export function orderLimits(side: ExchangeSide, good: Resource): {min: number, max: number} {
  if (side === 'sell') {
    return {min: NORMAL_SELL[good] + 1, max: bestRate('sell', good)};
  }
  return {min: bestRate('buy', good), max: Math.max(1, NORMAL_BUY[good] - 1)};
}

/**
 * Bet premium of a sell order that comes true: per unit as many Solari as its limit lies above the normal rate. Who
 * bets further gets more, but the order comes true less often. Buy orders get none: their discount already is the
 * gain (a premium on top would make buying free; Jens 24 Oct 2026).
 */
export function orderPremium(side: ExchangeSide, good: Resource, amount: number, limit: number): number {
  return side === 'sell' ? amount * Math.max(0, limit - NORMAL_SELL[good]) : 0;
}

/** Withdrawing an order gives back only half of what it binds (rounded down): an order is a bet, not a parking space */
export function orderRefund(bound: number): number {
  return Math.floor(bound / 2);
}

/** What an order binds: the goods of a sell order, the Solari (amount × limit) of a buy order */
export function orderBound(side: ExchangeSide, amount: number, limit: number): number {
  return side === 'sell' ? amount : amount * limit;
}

/**
 * Privilege: the emperor pays per unit 1 Solari more than the guild's sell rate of that generation, and never less than
 * normal + 1 – so it always beats both the normal rate and the guild (Jens 25 Oct 2026)
 */
export function privilegeRate(good: Resource, sellRate: number): number {
  return Math.max(sellRate, NORMAL_SELL[good]) + 1;
}

export function privilegePay(good: Resource, amount: number, sellRate: number): number {
  return amount * privilegeRate(good, sellRate);
}

/** One board as the client shows it: the normal rates and every generation's rates, the current one last */
export type ExchangeBoardModel = {
  normal: ExchangePrices,
  history: ReadonlyArray<ExchangePrices>,
  /** Rates of the next generation, already fixed (the forecast); missing in games from before it until their next generation */
  next?: ExchangePrices,
};

export type ExchangeModel = {
  sell: ExchangeBoardModel,
  buy: ExchangeBoardModel,
};
