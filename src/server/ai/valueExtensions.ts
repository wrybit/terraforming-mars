import {IPlayer} from '../IPlayer';

// Extra terms of a player's position value (stateValue.ts playerValue) contributed by optional game modules that
// the core valuation does not know, e.g. penalties that only fall due at the end of a generation. Each term is in
// M€ and gets the M€ value of one terraform rating step, the usual currency of such penalties.

export type ValueExtension = (player: IPlayer, terraformRatingValue: number) => number;

const extensions: Array<ValueExtension> = [];

/** Adds a term to every position value from now on (called once when a module's AI code is loaded). */
export function registerValueExtension(extension: ValueExtension): void {
  if (!extensions.includes(extension)) {
    extensions.push(extension);
  }
}

/** Sum of all registered terms for `player`; 0 without any. */
export function extensionValue(player: IPlayer, terraformRatingValue: number): number {
  let value = 0;
  for (const extension of extensions) {
    value += extension(player, terraformRatingValue);
  }
  return value;
}
