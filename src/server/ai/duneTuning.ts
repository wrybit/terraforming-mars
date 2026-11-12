import {IPlayer} from '../IPlayer';
import {playerVariant, registerTuningVariantNames} from './aiTuning';

// Own tuning of the AI in the Dune expansion (branch dune only), so aiTuning.ts on main stays free of Dune. Batches
// pick a variant by name like the main variants (aiTuning.ts registerTuningVariantNames / playerVariant).

export interface DuneTuning {
  /** Share of the TR an end-of-generation envy penalty costs that counts against the current envy (duneEnvyValue.ts); 0 = off. */
  envyAversion: number;
  /** Weight of the VP a running Kanly battle moves between players as the troops stand (duneKanlyValue.ts); 0 = off. */
  kanlyBattle: number;
  /** Share of the best tile the own garrison could take now that the Sardaukar are worth (duneKanlyValue.ts); 0 = off. */
  kanlyGarrison: number;
}

export const BASELINE_DUNE_TUNING: DuneTuning = {
  envyAversion: 0,
  kanlyBattle: 0,
  kanlyGarrison: 0,
};

export const DUNE_TUNING_VARIANTS: Record<string, Partial<DuneTuning>> = {
  // Round 202: in round 201 the houses voted against a player 11 times per game with all modules (24 TR lost per
  // game), after 30 guild trades and 11 exchange offers – the AI did not see the penalty coming at the end of the generation.
  envyAversion1: {envyAversion: 1},
  envyAversion05: {envyAversion: 0.5},
  // Round 203: Kanly was never opened (round 201); the battle's outcome and the garrison's chances count.
  kanly: {kanlyBattle: 1, kanlyGarrison: 0.5},
  kanlyBattleOnly: {kanlyBattle: 1},
};

registerTuningVariantNames(Object.keys(DUNE_TUNING_VARIANTS));

export function duneTuningOf(player: IPlayer): DuneTuning {
  const variant = playerVariant(player);
  const changes = variant === undefined ? undefined : DUNE_TUNING_VARIANTS[variant];
  return changes === undefined ? BASELINE_DUNE_TUNING : {...BASELINE_DUNE_TUNING, ...changes};
}
