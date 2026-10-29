import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {SpaceType} from '../../common/boards/SpaceType';
import {remainingProductionPhases} from './gameProgress';

// Tiles that score per adjacent city (Commercial District) counted every free city spot around them at a fixed 0.4
// chance. Five open spots then outweighed a real city next door: a human game placed the tile with no city next to it
// in generation 8 (1 VP at the end), while a spot with a city was free. Cities cannot touch each other, so at most
// three can surround one tile, and late in the game few free spots still get a city at all.

/** Most cities that fit around one space: every second space of the ring. */
const MOST_CITIES_AROUND = 3;
/** Fixed chance per open spot used before, now an upper bound. */
const OPEN_SPOT_CHANCE = 0.4;
/** Cities a player builds per remaining generation, on average. */
const CITIES_PER_GENERATION = 0.4;
/** Spots next to a tile that pays for cities are chosen more often than an average free spot. */
const SPOT_ATTRACTION = 2;

function isOpenCitySpot(space: Space, board: Board): boolean {
  return space.tile === undefined && space.spaceType === SpaceType.LAND &&
    !board.getAdjacentSpaces(space).some((next) => Board.isCitySpace(next));
}

/** Chance that any player still builds a city on a given open spot. */
function openSpotChance(game: IGame, player: IPlayer): number {
  let free = 0;
  for (const space of game.board.spaces) {
    if (isOpenCitySpot(space, game.board)) {
      free++;
    }
  }
  const expectedCities = game.players.length * (remainingProductionPhases(game, player) + 1) * CITIES_PER_GENERATION;
  return Math.min(OPEN_SPOT_CHANCE, SPOT_ATTRACTION * expectedCities / Math.max(1, free));
}

/** Cities expected to join the given neighbours later: open spots, at most as many as still fit, times the chance. */
export function expectedLaterCities(neighbours: ReadonlyArray<Space>, cities: number, player: IPlayer): number {
  const board = player.game.board;
  const open = neighbours.filter((neighbour) => isOpenCitySpot(neighbour, board)).length;
  const fit = Math.max(0, MOST_CITIES_AROUND - cities);
  return Math.min(open, fit) * openSpotChance(player.game, player);
}
