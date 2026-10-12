import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {SpaceType} from '../../common/boards/SpaceType';
import {tuningOf} from './aiTuning';

// Greeneries belong in a ring around an own city (aiTuning.ts greeneryRing).
//
// Human feedback: the AI placed greeneries in one place and its city somewhere else, sometimes on
// spots no own city could ever reach, and laid up to four greeneries before the city that adopts
// them – an opponent can then take the city spot in the made nest. The placement score punished
// free city spots next to a lonely greenery (opponent risk), which pushed lonely greeneries onto
// dead spots. Rule of thumb from the group: at most two greeneries, then a city.

type GameBoard = IGame['board'];

/** Free land where a city may still be placed (no city next to it). */
function isCitySpot(space: Space, board: GameBoard): boolean {
  return space.tile === undefined && space.spaceType === SpaceType.LAND &&
    !board.getAdjacentSpaces(space).some((next) => Board.isCitySpace(next));
}

function touchesOwnCity(space: Space, player: IPlayer, board: GameBoard): boolean {
  return board.getAdjacentSpaces(space).some((next) => Board.isCitySpace(next) && next.player === player);
}

/** Own greeneries that no own city touches yet. */
export function ownOrphans(player: IPlayer, board: GameBoard): Array<Space> {
  return board.spaces.filter((space) => space.player === player && Board.isGreenerySpace(space) &&
    !touchesOwnCity(space, player, board));
}

/**
 * Placement adjustment for a greenery without an own city next to it, in VP: a dead spot (no
 * city spot next to it) and a third or later orphan cost, a spot whose free city spot also
 * touches other own orphans gains (one city there adopts them all).
 */
export function lonelyGreeneryPoints(space: Space, player: IPlayer, board: GameBoard): number {
  const weight = tuningOf(player).greeneryRing;
  if (weight === 0) {
    return 0;
  }
  const orphans = ownOrphans(player, board).filter((orphan) => orphan !== space);
  const citySpots = board.getAdjacentSpaces(space).filter((next) => next !== space && isCitySpot(next, board));
  let points = 0;
  if (citySpots.length === 0) {
    points -= weight;
  }
  points -= weight * Math.max(0, orphans.length - 1);
  let bestCluster = 0;
  for (const spot of citySpots) {
    const around = board.getAdjacentSpaces(spot);
    bestCluster = Math.max(bestCluster, orphans.filter((orphan) => around.includes(orphan)).length);
  }
  return points + weight * 0.5 * bestCluster;
}

/** City placement: own orphans the city adopts (they stop inviting an opponent's city), in VP. */
export function adoptedOrphanPoints(space: Space, player: IPlayer, board: GameBoard): number {
  const weight = tuningOf(player).greeneryRing;
  if (weight === 0) {
    return 0;
  }
  return weight * 0.3 * board.getAdjacentSpaces(space).filter((next) =>
    next.player === player && Board.isGreenerySpace(next) && !touchesOwnCity(next, player, board)).length;
}

/** Board potential: more than two orphans at once, and orphans no city can reach any more, in VP. */
export function orphanPotential(player: IPlayer, board: GameBoard): number {
  const weight = tuningOf(player).greeneryRing;
  if (weight === 0) {
    return 0;
  }
  const orphans = ownOrphans(player, board);
  const dead = orphans.filter((orphan) => !board.getAdjacentSpaces(orphan).some((next) => isCitySpot(next, board))).length;
  return -weight * 0.5 * (Math.max(0, orphans.length - 2) + dead);
}
