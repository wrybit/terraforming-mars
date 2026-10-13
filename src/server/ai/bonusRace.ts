import {IPlayer} from '../IPlayer';
import {
  MAX_OXYGEN_LEVEL,
  MAX_TEMPERATURE,
  OXYGEN_LEVEL_FOR_TEMPERATURE_BONUS,
  TEMPERATURE_BONUS_FOR_HEAT_1,
  TEMPERATURE_BONUS_FOR_HEAT_2,
  TEMPERATURE_FOR_OCEAN_BONUS,
} from '../../common/constants';

// Global-parameter bonus steps (heat production at −24/−20 °C, an ocean at 0 °C, a temperature step
// at 8 % oxygen) go to whoever raises the parameter onto them. Strategy guides: snatch them, and never
// leave one a single step away for the rival. The AI only looked one move ahead, so a move that
// brought a parameter right before a bonus looked free, while the rival took the bonus next turn.

const HEAT_FOR_TEMPERATURE = 8;
const ASTEROID_PROJECT_COST = 14;
const GREENERY_PROJECT_COST = 23;
/** Chance a player raises the parameter without stock or money for a standard project (cards). */
const CARD_CHANCE = 0.3;
/** A player who has passed only gets the bonus in the next generation – if nobody takes it before. */
const PASSED_CHANCE = 0.2;

/** Chance that `player` raises the temperature by one step on the next turn. */
function temperatureReach(player: IPlayer): number {
  if (player.heat >= HEAT_FOR_TEMPERATURE) {
    return 1;
  }
  return player.megaCredits >= ASTEROID_PROJECT_COST ? 0.7 : CARD_CHANCE;
}

/** Chance that `player` raises the oxygen by one step on the next turn. */
function oxygenReach(player: IPlayer): number {
  if (player.plants >= player.plantsNeededForGreenery) {
    return 1;
  }
  return player.megaCredits >= GREENERY_PROJECT_COST ? 0.6 : CARD_CHANCE;
}

/**
 * M€ of bonus steps the next parameter step would give `player`, weighted by the chance that he can
 * take that step on his next turn. `trValue`: M€ of one terraform rating step, `heatProductionValue`:
 * M€ of one heat production step for the rest of the game.
 */
export function openBonusValue(player: IPlayer, trValue: number, heatProductionValue: number): number {
  const game = player.game;
  const passed = game.hasPassedThisActionPhase(player);
  let value = 0;
  const temperature = game.getTemperature();
  if (temperature < MAX_TEMPERATURE) {
    const next = temperature + 2;
    let bonus = 0;
    if (next === TEMPERATURE_BONUS_FOR_HEAT_1 || next === TEMPERATURE_BONUS_FOR_HEAT_2) {
      bonus = heatProductionValue;
    } else if (next === TEMPERATURE_FOR_OCEAN_BONUS && game.canAddOcean()) {
      // The ocean: one more TR plus about 2 M€ placement bonus.
      bonus = trValue + 2;
    }
    value += bonus * (passed ? PASSED_CHANCE : temperatureReach(player));
  }
  const oxygen = game.getOxygenLevel();
  if (oxygen < MAX_OXYGEN_LEVEL && oxygen + 1 === OXYGEN_LEVEL_FOR_TEMPERATURE_BONUS && temperature < MAX_TEMPERATURE) {
    value += trValue * (passed ? PASSED_CHANCE : oxygenReach(player));
  }
  return value;
}
