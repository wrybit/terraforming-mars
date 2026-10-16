import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';
import {remainingProductionPhases} from './gameProgress';

/**
 * Three-phase plan of strong human players (aiTuning.ts phasePlan):
 *  1. first third: build income, claim at least one milestone, terraform little;
 *  2. second third: terraform and block the opponent's spots on the map;
 *  3. last third: play the strong VP cards and live on the income.
 * The AI used to rush TR from generation 1 with M€ production 1–5 and lost by 60–70 VP to such players.
 */
export type GamePhase = 1 | 2 | 3;

/** Share of the game played: elapsed generations over elapsed plus remaining ones. */
export function phaseProgress(generation: number, remaining: number): number {
  const elapsed = Math.max(0, generation - 1);
  return elapsed / Math.max(1, elapsed + remaining + 1);
}

export function gamePhase(generation: number, remaining: number): GamePhase {
  const progress = phaseProgress(generation, remaining);
  return progress < 1 / 3 ? 1 : progress < 2 / 3 ? 2 : 3;
}

export function currentPhase(game: IGame, player?: IPlayer): GamePhase {
  return gamePhase(game.generation, remainingProductionPhases(game, player));
}

/** Factor on production value: 1 + strength in phase 1, fading to 1 through phase 2. */
export function incomeFactor(player: IPlayer, generation: number, remaining: number): number {
  const strength = tuningOf(player).phasePlan;
  if (strength <= 0) {
    return 1;
  }
  const progress = phaseProgress(generation, remaining);
  if (progress < 1 / 3) {
    return 1 + strength;
  }
  return progress < 2 / 3 ? 1 + strength * (2 / 3 - progress) * 3 : 1;
}

/** M€ each global step raised costs in phase 1 (terraform later, income first). */
export function openingTerraformBrake(player: IPlayer, generation: number, remaining: number): number {
  const strength = tuningOf(player).phasePlan;
  return strength > 0 && gamePhase(generation, remaining) === 1 ? OPENING_BRAKE_PER_STRENGTH * strength : 0;
}

/** Extra VP for holding at least one milestone, while decisions fall in phase 1 or 2. */
export function firstMilestoneBonus(player: IPlayer, generation: number, remaining: number): number {
  const strength = tuningOf(player).phasePlan;
  if (strength <= 0 || gamePhase(generation, remaining) === 3) {
    return 0;
  }
  const claimed = player.game.claimedMilestones.some((milestone) => milestone.player.id === player.id);
  return claimed ? FIRST_MILESTONE_BONUS_PER_STRENGTH * strength : 0;
}

/** Share of a VP for each opponent city spot taken away, in phase 2 (block the map). */
export function blockingShare(player: IPlayer): number {
  const strength = tuningOf(player).phasePlan;
  return strength > 0 && currentPhase(player.game, player) === 2 ? BLOCKING_SHARE_PER_STRENGTH * strength : 0;
}

const OPENING_BRAKE_PER_STRENGTH = 2;
const FIRST_MILESTONE_BONUS_PER_STRENGTH = 2;
const BLOCKING_SHARE_PER_STRENGTH = 0.5;
