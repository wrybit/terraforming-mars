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
  /** Share of the VP at stake in a Kanly that passing costs while a battle can still be opened or joined (duneKanlyStayIn.ts); 0 = off. */
  kanlyStayIn: number;
}

export const BASELINE_DUNE_TUNING: DuneTuning = {
  // Round 202 (all games with modules): 1 +4.89 VP (z +4.80), 0.5 +3.33 (z +3.14); TR lost to Landsraad votes per
  // player 9.9 → 4.6, guild trades 11.9 → 8.0 – adopted.
  envyAversion: 1,
  // Rounds 203–205 (variant kanly): +1.17, −0.16, +1.73 VP – pooled +0.76 ± 0.56 (z +1.36); the gain comes mostly from
  // defence (battles held 0.17 vs 0.02 per player and game) – adopted.
  kanlyBattle: 1,
  kanlyGarrison: 0.5,
  kanlyStayIn: 0,
};

export const DUNE_TUNING_VARIANTS: Record<string, Partial<DuneTuning>> = {
  // Round 202: in round 201 the houses voted against a player 11 times per game with all modules (24 TR lost per
  // game), after 30 guild trades and 11 exchange offers – the AI did not see the penalty coming at the end of the generation.
  envyAversion1: {envyAversion: 1},
  envyAversion05: {envyAversion: 0.5},
  // Round 203: one step further (still 3 votes per player and game with 1); noEnvyAversion is the check.
  envyAversion2: {envyAversion: 2},
  noEnvyAversion: {envyAversion: 0},
  // Round 203: Kanly was never opened (round 201); the battle's outcome and the garrison's chances count.
  kanly: {kanlyBattle: 1, kanlyGarrison: 0.5},
  kanlyBattleOnly: {kanlyBattle: 1, kanlyGarrison: 0},
  // Round 204: kanly +1.17 VP (z +1.15; all modules +2.95, z +1.78) – but the gain came from defence (holds 0.16 vs
  // 0.01 per player and game, Sardaukar 0.71 vs 0.17); tiles taken stayed at 0.03. A full share for the garrison
  // checks whether a stronger army leads to attacks.
  kanlyGarrison1: {kanlyBattle: 1, kanlyGarrison: 1},
  // Round 205: a passed owner cannot defend, and battles come at the end – stay in the generation with small moves
  // while a battle can still be opened or joined (Jens, 13 Nov 2026). On top of the kanly terms, which value joining.
  kanlyStayIn: {kanlyBattle: 1, kanlyGarrison: 0.5, kanlyStayIn: 1},
  // Round 206: kanly is in the baseline now; noKanly is the check. kanlyStayIn lost −2.31 VP (z −2.44) in round 205:
  // it took more tiles (0.10 vs 0.04) but lost more TR and traded more at the exchange while staying in – half weight.
  noKanly: {kanlyBattle: 0, kanlyGarrison: 0},
  kanlyStayIn05: {kanlyStayIn: 0.5},
};

registerTuningVariantNames(Object.keys(DUNE_TUNING_VARIANTS));

export function duneTuningOf(player: IPlayer): DuneTuning {
  const variant = playerVariant(player);
  const changes = variant === undefined ? undefined : DUNE_TUNING_VARIANTS[variant];
  return changes === undefined ? BASELINE_DUNE_TUNING : {...BASELINE_DUNE_TUNING, ...changes};
}
