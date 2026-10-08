import {IPlayer} from '../IPlayer';

// Adjustable AI parameters, so that two variants can play against each other in the same test
// game (A/B seats in tests/simulation/runAiBatch.ts). The server always plays the baseline.

export type AiTuning = {
  /** A card is bought when its value exceeds price + margin (M€). */
  buyMargin: number,
  /** Hand size the AI fills up to while more than 3 generations are left / at the end. */
  handTargetEarly: number,
  handTargetLate: number,
  /** Money kept back after buying cards while more than 3 generations are left. */
  researchReserveEarly: number,
  /** City placement: VP per other own / opponent city at a free spot next to the new city (spaceValue.ts). */
  sharedSpotShare: number,
  opponentSpotShare: number,
  /** Weight of the measured engine value of effect cards (engineValue.ts), 0 = off. */
  engineWeight: number,
};

// Card buying, found with A/B batches (same 100 deals, variants rotating through the seats):
// - before: margin 1.5, hand 6/3, reserve 4 – ~23 cards played per game (a human: 54);
// - margin -1, hand 9/4, reserve 0 won 58 of 130 seats against 43 (+2.8 VP);
// - margin -3, hand 12/5 won 55 against 50 (+2.2 VP, 35 cards played).
export const BASELINE_TUNING: AiTuning = {
  buyMargin: -3,
  handTargetEarly: 12,
  handTargetLate: 5,
  researchReserveEarly: 0,
  sharedSpotShare: 0.4,
  opponentSpotShare: 0.25,
  // A/B: weight 1 (clipped at 0) lost 45 : 58, weight 0.5 (unclipped) won 58 : 43.
  engineWeight: 0.5,
};

export const TUNING_VARIANTS: Record<string, Partial<AiTuning>> = {
  baseline: {},
};

export function isTuningVariant(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(TUNING_VARIANTS, name);
}

// By player id: game copies used for valuation have new player objects with the same ids.
const tuningByPlayer = new Map<string, AiTuning>();

export function setPlayerTuning(playerId: string, variant: string): void {
  tuningByPlayer.set(playerId, {...BASELINE_TUNING, ...TUNING_VARIANTS[variant]});
}

export function clearPlayerTunings(): void {
  tuningByPlayer.clear();
}

export function tuningOf(player: IPlayer): AiTuning {
  return tuningByPlayer.get(player.id) ?? BASELINE_TUNING;
}
