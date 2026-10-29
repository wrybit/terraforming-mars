import {IPlayer} from '../IPlayer';
import {Board} from '../boards/Board';
import {SpaceType} from '../../common/boards/SpaceType';
import {tuningOf} from './aiTuning';
import {remainingProductionPhases} from './gameProgress';

// The lonely-greenery penalty and the risk per open city spot (boardPotential.ts) were fixed amounts. Late in a game
// with many free city spots an opponent builds only a few more cities, so a given spot next to a greenery is rarely
// taken – yet the fixed penalty made the AI keep 61 plants instead of greeneries (human game). Opponent city cards
// are unknown, so the chance uses only the time left and the number of free city spots.

/** Cities an opponent builds per remaining generation, on average. */
const OPPONENT_CITIES_PER_GENERATION = 0.4;
/** Spots next to greeneries are more attractive than an average free spot (they score at once). */
const NEST_ATTRACTION = 3;

function freeCitySpots(board: Board): number {
  let free = 0;
  for (const space of board.spaces) {
    if (space.tile === undefined && space.spaceType === SpaceType.LAND &&
      !board.getAdjacentSpaces(space).some((neighbour) => Board.isCitySpace(neighbour))) {
      free++;
    }
  }
  return free;
}

/** Chance that an opponent still builds a city on a given open spot next to a greenery. */
export function opponentCityOdds(player: IPlayer): number {
  const remaining = remainingProductionPhases(player.game, player);
  const expectedCities = player.opponents.length * (remaining + 1) * OPPONENT_CITIES_PER_GENERATION;
  return Math.min(1, NEST_ATTRACTION * expectedCities / Math.max(1, freeCitySpots(player.game.board)));
}

/** Factor for the lonely/open greenery penalties: 1 when off, else weighted towards the odds above. */
export function lonelyGreeneryFactor(player: IPlayer): number {
  const weight = Math.min(1, tuningOf(player).lonelyGreeneryOdds);
  if (weight <= 0) {
    return 1;
  }
  return 1 - weight * (1 - opponentCityOdds(player));
}
