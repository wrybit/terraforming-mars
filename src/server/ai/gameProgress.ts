import {IGame} from '../IGame';
import {MAX_OCEAN_TILES, MAX_OXYGEN_LEVEL, MAX_TEMPERATURE, MIN_TEMPERATURE} from '../../common/constants';

// How far the game is and what a victory point is worth right now.
// Values follow docs/ai/bot-heuristics.md §1 and §6.

const TEMPERATURE_STEPS = (MAX_TEMPERATURE - MIN_TEMPERATURE) / 2;

/**
 * Typical game length. Experience of the group this fork is played in: about 12 generations,
 * sometimes 1-2 more or less, practically never longer. Solo games always last 14 (rules).
 */
const EXPECTED_GENERATIONS = 12;
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
export function remainingProductionPhases(game: IGame): number {
  if (game.isSoloMode()) {
    return Math.max(0, game.lastSoloGeneration() - game.generation);
  }
  const progress = terraformingProgress(game);
  if (progress >= 1) {
    return 0;
  }
  const byPriorLength = Math.max(0, EXPECTED_GENERATIONS - game.generation);
  // Early generations say little about the speed (tables build engines first).
  if (game.generation <= 3 || progress === 0) {
    return byPriorLength;
  }
  // Blend the prior with the speed the table actually terraforms at, but never stray far from
  // the prior: a slow start once made the AI expect 46 more generations and buy any production.
  const progressPerGeneration = progress / (game.generation - 1);
  const byObservedSpeed = (1 - progress) / progressPerGeneration;
  const blended = (byPriorLength + byObservedSpeed) / 2;
  const clamped = Math.min(byPriorLength + MAXIMUM_DEVIATION, Math.max(byPriorLength - MAXIMUM_DEVIATION, blended));
  // The game cannot end before the global parameters are maxed, however late it is. In a test
  // game the human kept terraforming slow until generation 13 (a quarter of the steps done); the
  // prior said "last generation", and the AI sold its 20 hand cards and lost 93 : 198.
  return Math.max(0, Math.round(clamped), minimumRemaining(game, progress));
}

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
export function victoryPointValue(game: IGame): number {
  const remaining = remainingProductionPhases(game);
  if (remaining === 0) {
    return 12;
  }
  return Math.min(10, 4 * Math.pow(1.1, Math.max(0, game.generation - 1)));
}
