import {Resource} from '@/common/Resource';
import {ExchangePrices} from '@/common/dune/smugglingExchange';

// Value under each tile of the smuggling trade (variant E of _outputs/dune-schmuggel-kurs/schmuggel-prototyp.html,
// Jens 22 Oct 2026): what one unit is worth in the good of the other side at today's rates, instead of always in
// Solari. "You get" shows the price in the good you pay with, "You give" the worth in the good you get. A plain
// number, no ratio; with Solari on the other side it stays the Solari coin.

export type TileValue = {
  /** Value in Solari (shown as the coin) or in another good */
  amount: number,
  /** The good the value is counted in; undefined: Solari */
  currency: Resource | undefined,
};

/**
 * Value of one unit of `resource`: on the give side (`selling`) in units of `other` (the chosen good to get), on the
 * get side in units of `other` (the chosen good to pay with)
 */
export function tileValue(resource: Resource, selling: boolean, other: Resource, sell: Readonly<ExchangePrices>, buy: Readonly<ExchangePrices>): TileValue {
  const own = selling ? sell[resource] : buy[resource];
  if (other === Resource.MEGACREDITS || other === resource) {
    return {amount: own, currency: undefined};
  }
  return {amount: own / (selling ? buy[other] : sell[other]), currency: other};
}

/** At most two decimals, in the number format of the language (0,33 in German) */
export function formatValue(amount: number, language: string): string {
  const rounded = Math.round(amount * 100) / 100;
  try {
    return rounded.toLocaleString(language, {maximumFractionDigits: 2});
  } catch {
    return String(rounded);
  }
}
