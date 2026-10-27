import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {SpaceType} from '../../common/boards/SpaceType';
import {tuningOf} from './aiTuning';

// Greenery "nests": free city spots next to own greeneries that the opponent then takes. In human games an
// opponent city went next to AI greeneries 1.75 times per game, next to human greeneries 1.19 times. The flat
// open-spot penalty in spaceValue.ts does not see whether an opponent can act soon, nor that two own greeneries
// at one free spot make it twice as attractive. Greeneries at the edge with no own city spot left stay lonely.

/** M€ from which an opponent can afford a city (standard project 25 M€). */
const CITY_MONEY = 25;
/** Spaces with at most this many land neighbours count as edge or corner. */
const EDGE_NEIGHBOURS = 3;

function cityAllowed(space: Space, board: IGame['board']): boolean {
  return space.tile === undefined && space.spaceType === SpaceType.LAND &&
    !board.getAdjacentSpaces(space).some((next) => Board.isCitySpace(next));
}

/** True if some opponent can build a city soon (money for the standard project). */
function opponentCanBuildCity(player: IPlayer): boolean {
  return player.opponents.some((opponent) => opponent.megaCredits >= CITY_MONEY);
}

/** VP to subtract for a greenery on this space: open spots the opponent can take, and edge greeneries without own city. */
export function nestGuardPenalty(space: Space, player: IPlayer, ownCitiesAdjacent: number): number {
  const weight = tuningOf(player).nestGuard;
  if (weight <= 0) {
    return 0;
  }
  const board = player.game.board;
  const neighbours = board.getAdjacentSpaces(space);
  const openSpots = neighbours.filter((neighbour) => cityAllowed(neighbour, board));
  let penalty = 0;
  if (opponentCanBuildCity(player)) {
    for (const spot of openSpots) {
      // Two own greeneries at one free spot (this one and another) make it worth 2 VP for an opponent city.
      const ownGreeneries = board.getAdjacentSpaces(spot)
        .filter((next) => next !== space && Board.isGreenerySpace(next) && next.player === player).length;
      penalty += ownGreeneries > 0 ? 1 : 0.5;
    }
  }
  const landNeighbours = neighbours.filter((neighbour) => neighbour.spaceType === SpaceType.LAND).length;
  if (ownCitiesAdjacent === 0 && openSpots.length === 0 && landNeighbours <= EDGE_NEIGHBOURS) {
    penalty += 1;
  }
  return weight * penalty;
}
