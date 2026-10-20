import {Resource} from '../Resource';

// Smuggling exchange (Dune module E, Jens 20 Oct 2026): two boards with rates in Solari per unit that change every
// generation. "Sell" is what the smugglers pay for what you give (high is good for you), "buy" what you pay for what
// you get (low is good for you). Solari themselves always stand at 1. Shared by server (rates, trades) and client
// (the history above the resource tiles).

/** Resources with a rate that moves; Solari (M€) stay fixed at 1 */
export const EXCHANGE_GOODS = [Resource.STEEL, Resource.TITANIUM, Resource.PLANTS, Resource.ENERGY, Resource.HEAT] as const;
export type ExchangeGood = typeof EXCHANGE_GOODS[number];

export type ExchangePrices = Record<Resource, number>;

/** Normal rates: selling at the worth of the value table (spice at its smuggling price 5), buying at double worth */
export const NORMAL_SELL: Readonly<ExchangePrices> = {megacredits: 1, steel: 2, titanium: 5, plants: 1, energy: 1, heat: 1};
export const NORMAL_BUY: Readonly<ExchangePrices> = {megacredits: 1, steel: 4, titanium: 6, plants: 2, energy: 2, heat: 2};

/** A rate never leaves its normal rate by more than this */
export const MAX_DEVIATION = 2;

/** One board as the client shows it: the normal rates and every generation's rates, the current one last */
export type ExchangeBoardModel = {
  normal: ExchangePrices,
  history: ReadonlyArray<ExchangePrices>,
};

export type ExchangeModel = {
  sell: ExchangeBoardModel,
  buy: ExchangeBoardModel,
};
