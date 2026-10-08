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
  /** 1: cards with a maximum requirement lose value for later when the window is closing. */
  closingWindow: number,
  /** Share of a hand card's value a card gets when its tags make that card playable. */
  enablerWeight: number,
  /** Early in the game, cards only worth playing later are bought at this share of their value. */
  lateBuyFactor: number,
  /** Draft: share of a card's value for the player who receives the rest (hate draft), 0 = off. */
  draftDenial: number,
  /** 1: raising global parameters shortens the game in the valuation (stateValue.ts contextFor). */
  tempoAware: number,
  /** Weight of the race term: raising steps is good when the strongest rival's engine grows faster (stateValue.ts closerTerm). */
  closer: number,
  /** Weight of the opponent's position in a two-player game (more players: 0.5). */
  opponentWeightTwoPlayers: number,
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
  // A/B: weight 1 (clipped at 0) lost 45 : 58, weight 0.5 won 58 : 43 in 100 games but 153 : 158
  // in 300 new games (z +0.3 vs +0.8) – no clear gain, so off again (it costs computing time).
  engineWeight: 0,
  closingWindow: 0,
  enablerWeight: 0,
  lateBuyFactor: 1,
  // A/B 2026-10-08: hate draft won clearly (z +1.83 over 800 games in two batches),
  // full opponent weight in two-player games too (2P: z +2.01 in 400 games).
  draftDenial: 0.5,
  tempoAware: 0,
  closer: 0,
  opponentWeightTwoPlayers: 1,
};

// Champion/challenger: a change only becomes the baseline when it wins clearly more seats than
// expected (z ≥ 1.64 in tests/simulation/compareVariants.py); 100 games are often not enough.
export const TUNING_VARIANTS: Record<string, Partial<AiTuning>> = {
  baseline: {},
  // Baseline before the hate draft and the zero-sum two-player valuation, to confirm both.
  previous: {draftDenial: 0, opponentWeightTwoPlayers: 0.5},
  // Earlier baselines, to re-check adopted changes with more games:
  engine: {engineWeight: 0.5},
  fewerCards: {buyMargin: -1, handTargetEarly: 9, handTargetLate: 4},
  // Card timing as the group plays it: closing windows, enabler cards, late cards bought later.
  cardTiming: {closingWindow: 1, enablerWeight: 0.5, lateBuyFactor: 0.6},
  // Draft: also take away what the next player would like (standard variant of the group).
  hateDraft: {draftDenial: 0.5},
  // From a human game: the AI led until generation 12 but let the game run on; the human's engine won.
  // A/B: lost clearly (z -1.81) – raising parameters for the shorter game costs too much.
  tempo: {tempoAware: 1},
  zeroSumTwoPlayers: {opponentWeightTwoPlayers: 1},
  // Tempo done right: end the game when the rival's engine grows faster, drag it out otherwise.
  closer: {closer: 1},
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
