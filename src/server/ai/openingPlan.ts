import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {SpaceType} from '../../common/boards/SpaceType';
import {SpaceBonus} from '../../common/boards/SpaceBonus';
import {SpaceId} from '../../common/Types';
import {tuningOf} from './aiTuning';

// Opening build plan: before the first own tile, pick the home cluster – one city spot and its two
// best free neighbours for greeneries – and place the first tiles into it, whatever comes first.
// Human feedback: the AI put its first greenery far away at two oceans and its first city at the
// other end of the map, each chosen on its own. Experienced players plan "city here, greeneries
// there" and fill it over several generations.
//
// Recomputed from the board (cached until the next tile), so it stays the same while nobody builds
// there and moves on when an opponent takes the spot. Active until the first own city stands; a
// greenery placed before that pulls the city next to it.

const BONUS_VALUE: Partial<Record<SpaceBonus, number>> = {
  [SpaceBonus.TITANIUM]: 3,
  [SpaceBonus.STEEL]: 2,
  [SpaceBonus.PLANT]: 2,
  [SpaceBonus.DRAW_CARD]: 3,
};
const OCEAN_ADJACENCY_VALUE = 2;
/** Greenery spots planned next to the city. */
const PLANNED_GREENERIES = 2;

/** Space ids, not spaces: game copies have their own space objects but share the cache. */
export type OpeningPlan = {city: SpaceId, greeneries: ReadonlyArray<SpaceId>};

// The plan only changes when a tile is placed; remembered per game, player, generation and tile count.
const planCache = new Map<string, OpeningPlan | undefined>();

function placementGain(space: Space, board: IPlayer['game']['board']): number {
  const bonus = space.bonus.reduce((sum, item) => sum + (BONUS_VALUE[item] ?? 1), 0);
  return bonus + board.getAdjacentSpaces(space).filter((neighbour) => Board.isOceanSpace(neighbour)).length * OCEAN_ADJACENCY_VALUE;
}

function isFreeLand(space: Space): boolean {
  return space.tile === undefined && space.spaceType === SpaceType.LAND;
}

/**
 * The home cluster while the player has no city on Mars yet; undefined afterwards (then the normal
 * placement values take over) or when the setting is off.
 * `cityValue` values a city spot (spaceValue.ts), passed in to avoid an import cycle.
 */
export function openingPlan(player: IPlayer, cityValue: (space: Space) => number): OpeningPlan | undefined {
  if (tuningOf(player).openingPlan <= 0) {
    return undefined;
  }
  const board = player.game.board;
  if (board.spaces.some((space) => space.player === player && Board.isCitySpace(space))) {
    return undefined;
  }
  const tiles = board.spaces.filter((space) => space.tile !== undefined).length;
  const key = `${player.game.id}|${player.id}|${player.game.generation}|${tiles}`;
  const cached = planCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  // A greenery is already there: the city goes next to it.
  const ownGreeneries = board.spaces.filter((space) => space.player === player && Board.isGreenerySpace(space));
  const allowed = board.getAvailableSpacesForCity(player);
  const nextToOwn = allowed.filter((space) => board.getAdjacentSpaces(space).some((neighbour) => ownGreeneries.includes(neighbour)));
  let best: {plan: OpeningPlan, score: number} | undefined;
  for (const city of nextToOwn.length > 0 ? nextToOwn : allowed) {
    // Greeneries: the free neighbours with the best placement bonus (they also score for the city).
    const greeneries = board.getAdjacentSpaces(city).filter(isFreeLand)
      .sort((a, b) => placementGain(b, board) - placementGain(a, board))
      .slice(0, PLANNED_GREENERIES);
    const score = cityValue(city) + greeneries.reduce((sum, space) => sum + placementGain(space, board), 0);
    if (best === undefined || score > best.score) {
      best = {plan: {city: city.id, greeneries: greeneries.map((space) => space.id)}, score};
    }
  }
  if (planCache.size > 1000) {
    planCache.clear();
  }
  planCache.set(key, best?.plan);
  return best?.plan;
}
