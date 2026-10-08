import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';
import {MAX_OCEAN_TILES, MAX_OXYGEN_LEVEL, MAX_TEMPERATURE, MIN_TEMPERATURE} from '../../common/constants';

// How far the game is and what a victory point is worth right now.
// Values follow docs/ai/bot-heuristics.md §1 and §6.

const TEMPERATURE_STEPS = (MAX_TEMPERATURE - MIN_TEMPERATURE) / 2;

/**
 * Typical game length. Experience of the group this fork is played in: about 12 generations,
 * sometimes 1-2 more or less, practically never longer. Solo games always last 14 (rules).
 */
const EXPECTED_GENERATIONS = 12;
/**
 * Measured in AI test batches (2026-10-08): 2 players 14.3–15.5 generations, 3 players 11.5–12.7;
 * a human 2-player game lasted 16. With the fixed 12 the AI thought from generation 8 on that only
 * ~4 were left, valued production and engine cards too low and lost 108 : 209 (aiTuning.ts lengthByPlayers).
 */
const GENERATIONS_BY_PLAYER_COUNT: Record<number, number> = {2: 15, 3: 12};

/** Typical game length for this player's AI variant. */
export function expectedGenerations(game: IGame, player?: IPlayer): number {
  if (player === undefined || tuningOf(player).lengthByPlayers <= 0) {
    return EXPECTED_GENERATIONS;
  }
  return GENERATIONS_BY_PLAYER_COUNT[game.players.length] ?? (game.players.length > 3 ? 11 : EXPECTED_GENERATIONS);
}

/** How many generations the observed terraforming speed may move the estimate. */
const MAXIMUM_DEVIATION = 2;

/** Global parameter steps still to raise before the game ends. */
export function stepsLeft(game: IGame): number {
  return (1 - terraformingProgress(game)) * (TEMPERATURE_STEPS + MAX_OXYGEN_LEVEL + MAX_OCEAN_TILES);
}

/** Share of the three global parameters already raised, 0..1. */
export function terraformingProgress(game: IGame): number {
  const temperatureSteps = (game.getTemperature() - MIN_TEMPERATURE) / 2;
  const oceans = game.board.getOceanSpaces().length;
  const raised = temperatureSteps + game.getOxygenLevel() + oceans;
  return Math.min(1, raised / (TEMPERATURE_STEPS + MAX_OXYGEN_LEVEL + MAX_OCEAN_TILES));
}

export function isTemperatureMaxed(game: IGame): boolean {
  return game.getTemperature() >= MAX_TEMPERATURE;
}

/** Estimated production phases still to come (0 in the last generation). */
export function remainingProductionPhases(game: IGame, player?: IPlayer): number {
  if (game.isSoloMode()) {
    return Math.max(0, game.lastSoloGeneration() - game.generation);
  }
  const progress = terraformingProgress(game);
  if (progress >= 1) {
    return 0;
  }
  const byPriorLength = Math.max(0, expectedGenerations(game, player) - game.generation);
  // Early generations say little about the speed (tables build engines first).
  if (game.generation <= 3 || progress === 0) {
    return byPriorLength;
  }
  // Blend the prior with the speed the table actually terraforms at, but never stray far from
  // the prior: a slow start once made the AI expect 46 more generations and buy any production.
  const curved = player !== undefined && tuningOf(player).lengthModel > 0;
  const byObservedSpeed = curved ? curvedRemaining(game.generation, progress) : (1 - progress) / (progress / (game.generation - 1));
  const observedWeight = curved ? Math.min(0.95, CURVE_WEIGHT + CURVE_WEIGHT_PER_GENERATION * (game.generation - 4)) : 0.5;
  const deviation = curved ? CURVE_DEVIATION : MAXIMUM_DEVIATION;
  const blended = observedWeight * byObservedSpeed + (1 - observedWeight) * byPriorLength;
  const clamped = Math.min(byPriorLength + deviation, Math.max(byPriorLength - deviation, blended));
  // The game cannot end before the global parameters are maxed, however late it is. In a test
  // game the human kept terraforming slow until generation 13 (a quarter of the steps done); the
  // prior said "last generation", and the AI sold its 20 hand cards and lost 93 : 198.
  return Math.max(0, Math.round(clamped), minimumRemaining(game, progress));
}

/**
 * Terraforming speeds up: tables build engines first and raise most steps at the end. Fitted on
 * 57 000 generation starts of AI test games and 9 human games: progress grows about with the
 * square of the generations played, so with progress p after g − 1 generations the game ends
 * after (g − 1) / √p generations. The straight-line estimate expected far too long games
 * (a quarter done after 9 generations → 27 more; it was 6).
 * Mean error in generations (AI 2P / AI 3P / human 2P): straight line with 12: 1.41 / 1.45 / 1.10,
 * straight line with 15/12: 1.86 / 1.45 / 1.96, curve: 1.24 / 0.80 / 0.75.
 */
function curvedRemaining(generation: number, progress: number): number {
  return (generation - 1) * (1 / Math.sqrt(progress) - 1);
}
const CURVE_WEIGHT = 0.3;
const CURVE_WEIGHT_PER_GENERATION = 0.05;
const CURVE_DEVIATION = 1;

/** Production phases at least still to come: the steps left at a fast pace of the table. */
function minimumRemaining(game: IGame, progress: number): number {
  const stepsLeft = (1 - progress) * (TEMPERATURE_STEPS + MAX_OXYGEN_LEVEL + MAX_OCEAN_TILES);
  const fastStepsPerGeneration = 2 + 3 * game.players.length;
  return Math.floor(stepsLeft / fastStepsPerGeneration);
}

/**
 * How likely the running generation is the last one, 0..1. The game ends after the generation in
 * which the last global step is raised, so at the start of that generation the parameters are
 * not yet maxed. Measured in 100 AI games: with 3 players and at most 4 steps left (2 players:
 * 3 steps) it was the last generation in about 3 of 4 cases.
 */
export function lastGenerationLikelihood(game: IGame): number {
  if (game.isSoloMode()) {
    return game.generation >= game.lastSoloGeneration() ? 1 : 0;
  }
  const stepsLeft = Math.round((1 - terraformingProgress(game)) * (TEMPERATURE_STEPS + MAX_OXYGEN_LEVEL + MAX_OCEAN_TILES));
  if (stepsLeft === 0) {
    return 1;
  }
  const quickSteps = Math.max(3, game.players.length + 1);
  if (stepsLeft <= quickSteps) {
    return 0.75;
  }
  return stepsLeft <= 2 * quickSteps ? 0.3 : 0;
}

/** M€ value of one VP: cheap early (money still compounds), expensive late. */
export function victoryPointValue(game: IGame, player?: IPlayer): number {
  const remaining = remainingProductionPhases(game, player);
  if (remaining === 0) {
    return 12;
  }
  return Math.min(10, 4 * Math.pow(1.1, Math.max(0, game.generation - 1)));
}
