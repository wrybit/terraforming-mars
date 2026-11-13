import {IPlayer} from '../IPlayer';

// Extra cost of passing contributed by optional game modules that the core move search does not know, e.g. a module
// where a player who has passed can no longer answer an opponent's move. Each term is in M€ and gets the M€ value of
// one victory point at this moment; the move search takes the sum off the pass option (actionLookahead.ts).

export type PassExtension = (player: IPlayer, victoryPointValue: number) => number;

const extensions: Array<PassExtension> = [];

/** Adds a term to every pass decision from now on (called once when a module's AI code is loaded). */
export function registerPassExtension(extension: PassExtension): void {
  if (!extensions.includes(extension)) {
    extensions.push(extension);
  }
}

/** M€ taken off passing for `player`: sum of all registered terms; 0 without any. */
export function passExtensionPenalty(player: IPlayer, victoryPointValue: number): number {
  let penalty = 0;
  for (const extension of extensions) {
    penalty += extension(player, victoryPointValue);
  }
  return penalty;
}
