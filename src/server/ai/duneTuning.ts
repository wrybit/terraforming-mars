import {IPlayer} from '../IPlayer';
import {playerVariant, registerTuningVariantNames} from './aiTuning';

// Own tuning of the AI in the Dune expansion (branch dune only), so aiTuning.ts on main stays free of Dune. Batches
// pick a variant by name like the main variants (aiTuning.ts registerTuningVariantNames / playerVariant).

export interface DuneTuning {
  /** Share of the TR an end-of-generation envy penalty costs that counts against the current envy (duneEnvyValue.ts); 0 = off. */
  envyAversion: number;
}

export const BASELINE_DUNE_TUNING: DuneTuning = {
  envyAversion: 0,
};

export const DUNE_TUNING_VARIANTS: Record<string, Partial<DuneTuning>> = {
  // Round 202: in round 201 the houses voted against a player 11 times per game with all modules (24 TR lost per
  // game), after 30 guild trades and 11 exchange offers – the AI did not see the penalty coming at the end of the generation.
  envyAversion1: {envyAversion: 1},
  envyAversion05: {envyAversion: 0.5},
};

registerTuningVariantNames(Object.keys(DUNE_TUNING_VARIANTS));

export function duneTuningOf(player: IPlayer): DuneTuning {
  const variant = playerVariant(player);
  const changes = variant === undefined ? undefined : DUNE_TUNING_VARIANTS[variant];
  return changes === undefined ? BASELINE_DUNE_TUNING : {...BASELINE_DUNE_TUNING, ...changes};
}
