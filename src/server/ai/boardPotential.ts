import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {SpaceType} from '../../common/boards/SpaceType';

// Future VP on the board that the final scoring does not show yet, in VP.
//
// Experienced players place cities first and fill the gaps with greeneries afterwards: a city
// keeps its free neighbours for its owner's greeneries (no other city may be placed next to
// it), while a greenery without an own city is open to an opponent's city "in the made nest"
// (test game 3: the AI placed 14 greeneries, the opponent put cities next to them).

// Share of a city's free neighbours that typically become greeneries (1 VP each for the city).
const CITY_NEIGHBOUR_SHARE = 0.6;
// Chance that an opponent puts a city on a free spot next to a lonely greenery.
const EXPOSED_SPOT_RISK = 0.5;
// A greenery without an own city next to it scores its single VP but none for a city:
// while there is time, build the city first and fill the gaps afterwards.
const LONELY_GREENERY_PENALTY = 0.6;

function isFreeLand(space: Space): boolean {
  return space.tile === undefined && space.spaceType === SpaceType.LAND;
}

export function boardPotential(player: IPlayer): number {
  const board = player.game.board;
  let potential = 0;
  for (const space of board.spaces) {
    if (space.player !== player || space.tile === undefined) {
      continue;
    }
    const neighbours = board.getAdjacentSpaces(space);
    if (Board.isCitySpace(space)) {
      potential += neighbours.filter(isFreeLand).length * CITY_NEIGHBOUR_SHARE;
    } else if (Board.isGreenerySpace(space)) {
      // Free spots where any player may still put a city (no city next to them yet).
      const exposed = neighbours.filter((neighbour) =>
        isFreeLand(neighbour) && !board.getAdjacentSpaces(neighbour).some((next) => Board.isCitySpace(next)));
      potential -= exposed.length * EXPOSED_SPOT_RISK;
      if (!neighbours.some((neighbour) => Board.isCitySpace(neighbour) && neighbour.player === player)) {
        potential -= LONELY_GREENERY_PENALTY;
      }
    }
  }
  return potential;
}
