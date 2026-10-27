import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {SpaceBonus} from '../../common/boards/SpaceBonus';
import {SpaceType} from '../../common/boards/SpaceType';
import {tuningOf} from './aiTuning';

// Strong players stake out territory with their first cities: 3.4 spaces apart on average (AI 2.7), on card
// spaces (19 % of the first three cities, AI 6 %) and next to oceans. Later they put cities into the gap between
// opponent cities (0.13 per game, AI 0.05) so the opponent cannot close a three-city ring around shared spots.

/** Own cities up to which the territory bonus applies (the 2nd and 3rd city). */
const SPREAD_CITIES = 2;
/** Search depth for the distance to the nearest own city. */
const MAXIMUM_DISTANCE = 5;

/** Steps from the space to the nearest own city (MAXIMUM_DISTANCE + 1 when none is that close). */
function distanceToOwnCity(space: Space, player: IPlayer): number {
  const board = player.game.board;
  let frontier = [space];
  const seen = new Set([space.id]);
  for (let distance = 1; distance <= MAXIMUM_DISTANCE; distance++) {
    const next: Array<Space> = [];
    for (const current of frontier) {
      for (const neighbour of board.getAdjacentSpaces(current)) {
        if (seen.has(neighbour.id)) {
          continue;
        }
        if (Board.isCitySpace(neighbour) && neighbour.player === player) {
          return distance;
        }
        seen.add(neighbour.id);
        next.push(neighbour);
      }
    }
    frontier = next;
  }
  return MAXIMUM_DISTANCE + 1;
}

/** Free spots next to the space that touch at least two opponent cities (their shared greenery spots). */
function sharedOpponentSpots(space: Space, player: IPlayer): number {
  const board = player.game.board;
  return board.getAdjacentSpaces(space).filter((spot) => spot.tile === undefined && spot.spaceType === SpaceType.LAND &&
    board.getAdjacentSpaces(spot).filter((next) => Board.isCitySpace(next) && next.player !== undefined && next.player !== player).length >= 2,
  ).length;
}

/** VP to add for a city on this space: spread-out territory, card and ocean spots, spoiling opponent rings. */
export function cityClaimSpreadBonus(space: Space, player: IPlayer): number {
  const weight = tuningOf(player).cityClaimSpread;
  if (weight <= 0) {
    return 0;
  }
  const board = player.game.board;
  let bonus = 0;
  const ownCities = board.spaces.filter((next) => Board.isCitySpace(next) && next.player === player).length;
  if (ownCities >= 1 && ownCities <= SPREAD_CITIES) {
    const distance = distanceToOwnCity(space, player);
    if (distance === 3 || distance === 4) {
      bonus += 1;
    }
  }
  if (ownCities <= SPREAD_CITIES) {
    if (space.bonus.includes(SpaceBonus.DRAW_CARD)) {
      bonus += 0.5;
    }
    bonus += board.getAdjacentSpaces(space).filter((neighbour) => Board.isOceanSpace(neighbour)).length * 0.25;
  }
  bonus += Math.min(2, sharedOpponentSpots(space, player));
  return weight * bonus;
}
