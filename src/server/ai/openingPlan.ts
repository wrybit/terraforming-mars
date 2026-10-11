import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {SpaceType} from '../../common/boards/SpaceType';
import {SpaceBonus} from '../../common/boards/SpaceBonus';
import {SpaceId} from '../../common/Types';
import {tuningOf} from './aiTuning';

// Opening build plan: before the first own tile, pick the home cluster – the first city spot, a second
// city two rows away and the greenery spots between them – and place the first tiles into it,
// whatever comes first (group tip: cities in pairs at that distance, then fill the greeneries).
// Human feedback: the AI put its first greenery far away at two oceans and its first city at the
// other end of the map, each chosen on its own. Experienced players plan "city here, greeneries
// there" and fill it over several generations.
//
// Recomputed from the board (cached until the next tile), so it stays the same while nobody builds
// there and changes when an opponent takes a planned spot. Active until two own cities stand; a
// greenery placed before the first city pulls the city next to it.

const BONUS_VALUE: Partial<Record<SpaceBonus, number>> = {
  [SpaceBonus.TITANIUM]: 3,
  [SpaceBonus.STEEL]: 2,
  [SpaceBonus.PLANT]: 2,
  [SpaceBonus.DRAW_CARD]: 3,
};
const OCEAN_ADJACENCY_VALUE = 2;
/** Greenery spots planned next to the first city (shared spots with the second city first). */
const PLANNED_GREENERIES = 3;
/** Value of a free spot shared by both cities (a greenery there scores for two cities), in placement units. */
const SHARED_SPOT_VALUE = 1.5;
/** How much the second city's spot counts when the first one is chosen. */
const SECOND_CITY_SHARE = 0.5;

/**
 * Space ids, not spaces: game copies have their own space objects but share the cache.
 * `cities`: planned city spots, the first one first; `started`: the first city already stands.
 */
export type OpeningPlan = {cities: ReadonlyArray<SpaceId>, greeneries: ReadonlyArray<SpaceId>, started: boolean};

// The plan only changes when a tile is placed; remembered per game, player and occupied spaces.
const planCache = new Map<string, OpeningPlan | undefined>();

function placementGain(space: Space, board: IPlayer['game']['board']): number {
  const bonus = space.bonus.reduce((sum, item) => sum + (BONUS_VALUE[item] ?? 1), 0);
  return bonus + board.getAdjacentSpaces(space).filter((neighbour) => Board.isOceanSpace(neighbour)).length * OCEAN_ADJACENCY_VALUE;
}

function isFreeLand(space: Space): boolean {
  return space.tile === undefined && space.spaceType === SpaceType.LAND;
}

/** Second city: two rows away from the first, sharing free spots where one greenery scores for both. */
function secondCity(first: Space, allowed: ReadonlyArray<Space>, board: IPlayer['game']['board'], cityValue: (space: Space) => number): {city: Space, shared: Array<Space>, score: number} | undefined {
  const around = board.getAdjacentSpaces(first);
  let best: {city: Space, shared: Array<Space>, score: number} | undefined;
  for (const city of allowed) {
    if (city === first || around.includes(city)) {
      continue;
    }
    const shared = board.getAdjacentSpaces(city).filter((space) => around.includes(space) && isFreeLand(space));
    if (shared.length === 0) {
      continue;
    }
    const score = cityValue(city) + SHARED_SPOT_VALUE * shared.length;
    if (best === undefined || score > best.score) {
      best = {city, shared, score};
    }
  }
  return best;
}

/**
 * The home cluster until the player has two cities on Mars; undefined afterwards (then the normal
 * placement values take over) or when the setting is off. Before the first city: city spot, a second
 * city two rows away and the greenery spots between them. With one city: the second city and the
 * shared spots. `cityValue` values a city spot (spaceValue.ts), passed in to avoid an import cycle.
 */
export function openingPlan(player: IPlayer, cityValue: (space: Space) => number): OpeningPlan | undefined {
  if (tuningOf(player).openingPlan <= 0) {
    return undefined;
  }
  const board = player.game.board;
  const ownCities = board.spaces.filter((space) => space.player === player && Board.isCitySpace(space));
  if (ownCities.length >= 2) {
    return undefined;
  }
  // Key: the occupied spaces themselves, not just their count – game copies in the search place the
  // same number of tiles on different spaces and must not share a plan.
  const occupied = board.spaces.filter((space) => space.tile !== undefined).map((space) => space.id).join(',');
  const key = `${player.game.id}|${player.id}|${occupied}`;
  if (planCache.has(key)) {
    return planCache.get(key);
  }
  const allowed = board.getAvailableSpacesForCity(player);
  let plan: OpeningPlan | undefined;
  if (ownCities.length === 1) {
    const second = secondCity(ownCities[0], allowed, board, cityValue);
    plan = second === undefined ? undefined : {cities: [second.city.id], greeneries: second.shared.map((space) => space.id), started: true};
  } else {
    // A greenery is already there: the first city goes next to it.
    const ownGreeneries = board.spaces.filter((space) => space.player === player && Board.isGreenerySpace(space));
    const nextToOwn = allowed.filter((space) => board.getAdjacentSpaces(space).some((neighbour) => ownGreeneries.includes(neighbour)));
    let best: {plan: OpeningPlan, score: number} | undefined;
    for (const city of nextToOwn.length > 0 ? nextToOwn : allowed) {
      const second = secondCity(city, allowed, board, cityValue);
      // Greeneries: the shared spots first (they score for both cities), then the best other neighbours.
      const shared = second?.shared ?? [];
      const others = board.getAdjacentSpaces(city).filter((space) => isFreeLand(space) && !shared.includes(space))
        .sort((a, b) => placementGain(b, board) - placementGain(a, board));
      const greeneries = [...shared, ...others].slice(0, PLANNED_GREENERIES);
      const score = cityValue(city) + (second === undefined ? 0 : SECOND_CITY_SHARE * second.score) +
        greeneries.reduce((sum, space) => sum + placementGain(space, board), 0);
      if (best === undefined || score > best.score) {
        const cities = second === undefined ? [city.id] : [city.id, second.city.id];
        best = {plan: {cities, greeneries: greeneries.map((space) => space.id), started: false}, score};
      }
    }
    plan = best?.plan;
  }
  if (planCache.size > 1000) {
    planCache.clear();
  }
  planCache.set(key, plan);
  return plan;
}
