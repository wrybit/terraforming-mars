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
};

export const BASELINE_TUNING: AiTuning = {
  buyMargin: 1.5,
  handTargetEarly: 6,
  handTargetLate: 3,
  researchReserveEarly: 4,
};

export const TUNING_VARIANTS: Record<string, Partial<AiTuning>> = {
  baseline: {},
  // Test game: the AI played 21 cards, the human 54. Buy more freely.
  moreCards: {buyMargin: -1, handTargetEarly: 9, handTargetLate: 4, researchReserveEarly: 0},
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
