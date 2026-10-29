import {IPlayer} from '../IPlayer';
import {TileType} from '../../common/TileType';
import {tuningOf} from './aiTuning';
import {plantFactor} from './playerTraits';

// Plants on hand counted at their full value however many there were, so a greenery that the lonely-greenery
// penalty (boardPotential.ts) and city first (cityFirstAction.ts) make look slightly worse lost against keeping the
// plants – every turn again. In a human game the AI held 61 plants in generation 10 with no city and no money for
// one, and converted only at the end. Waiting is only worth something when a city is actually coming: without a
// city plan the plants above one greenery lose part of their value, and plants that cannot be converted any more in
// the remaining generations (one action per greenery) lose all of it. Attacks on plants are already priced in
// attackExposure.ts (share of the plants held).

/** M€ of plants on hand, as in stateValue.ts resourceValue. */
const PLANT_VALUE = 1.5;
/** Share of the waiting plants lost while no city is planned. */
const NO_PLAN_SHARE = 0.5;
/** Greeneries from plants a player can realistically place per generation (each one is an action). */
const CONVERSIONS_PER_GENERATION = 3;
const CITY_PROJECT_COST = 25;

/**
 * True when a city can follow soon: a playable hand card that builds a city, or the money for the city standard
 * project now. Income alone is no plan – the human game had 35 M€ income per generation and built no city.
 */
export function hasCityPlan(player: IPlayer): boolean {
  if (player.megaCredits >= CITY_PROJECT_COST) {
    return true;
  }
  return player.cardsInHand.some((card) => card.tilesBuilt.includes(TileType.CITY) && player.canPlay(card));
}

/** True when plantHoardDecay is on and no city is planned: waiting plants for a city makes no sense then. */
export function hoardingWithoutCityPlan(player: IPlayer): boolean {
  return tuningOf(player).plantHoardDecay > 0 && !hasCityPlan(player);
}

/** M€ to take off the value of the plants on hand (0 when off). */
export function plantHoardDiscount(player: IPlayer, remaining: number): number {
  const weight = tuningOf(player).plantHoardDecay;
  const need = player.plantsNeededForGreenery;
  const excess = player.plants - need;
  if (weight <= 0 || excess <= 0) {
    return 0;
  }
  // Plants beyond what the remaining generations can turn into greeneries are worth nothing.
  const convertible = need * CONVERSIONS_PER_GENERATION * (Math.max(0, remaining) + 1);
  const stuck = Math.max(0, player.plants - convertible);
  const waiting = Math.max(0, excess - stuck);
  const waitingShare = hasCityPlan(player) ? 0 : NO_PLAN_SHARE;
  return weight * PLANT_VALUE * plantFactor(player) * (waiting * waitingShare + stuck);
}
