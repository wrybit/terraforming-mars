import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';

// Lasting player traits set by cards (Advanced Alloys, PhoboLog, Mercurian Alloys, Rego Plastics: steel or titanium
// worth more; Helion: heat spends as M€; Ecoline: 7 plants per greenery). The position value used fixed rates for
// production and plants, so buying such a card showed only its small immediate effect.

const BASE_STEEL_VALUE = 2;
const BASE_TITANIUM_VALUE = 3;
const BASE_PLANTS_PER_GREENERY = 8;

function active(player: IPlayer): boolean {
  return tuningOf(player).playerTraitValues > 0;
}

/** Steel production counts with the player's steel value (1 without the rule). */
export function steelFactor(player: IPlayer): number {
  return active(player) ? player.getSteelValue() / BASE_STEEL_VALUE : 1;
}

/** Titanium production counts with the player's titanium value (1 without the rule). */
export function titaniumFactor(player: IPlayer): number {
  return active(player) ? player.getTitaniumValue() / BASE_TITANIUM_VALUE : 1;
}

/** Plants count more when a greenery needs fewer of them (1 without the rule). */
export function plantFactor(player: IPlayer): number {
  return active(player) ? BASE_PLANTS_PER_GREENERY / Math.max(1, player.plantsNeededForGreenery) : 1;
}

/** Heat that can be spent as M€ is worth at least 1 M€ per unit, even once the temperature is maxed. */
export function heatAsMoney(player: IPlayer, heatValue: number): number {
  return active(player) && player.canUseHeatAsMegaCredits ? Math.max(heatValue, 1) : heatValue;
}
