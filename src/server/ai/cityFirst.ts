import {IPlayer} from '../IPlayer';
import {Board} from '../boards/Board';
import {tuningOf} from './aiTuning';

// Strong players keep one city ahead of their greeneries: the city comes first, the greeneries go around it and
// score twice (city point + greenery point). In human games 29 % of human greeneries were placed while the
// player had more cities than greeneries, only 15 % of the AI's – the AI laid greeneries first and tried to
// add cities afterwards, often too late or after the opponent had taken the spot.

/** Own cities and greeneries on the board. */
function ownTileCounts(player: IPlayer): {cities: number, greeneries: number} {
  let cities = 0;
  let greeneries = 0;
  for (const space of player.game.board.spaces) {
    if (space.player !== player) {
      continue;
    }
    if (Board.isCitySpace(space)) {
      cities++;
    } else if (Board.isGreenerySpace(space)) {
      greeneries++;
    }
  }
  return {cities, greeneries};
}

/** VP to subtract from a greenery without an adjacent own city while own cities do not lead own greeneries. */
export function cityFirstPenalty(player: IPlayer, ownCitiesAdjacent: number): number {
  const weight = tuningOf(player).cityFirst;
  if (weight <= 0 || ownCitiesAdjacent > 0) {
    return 0;
  }
  const {cities, greeneries} = ownTileCounts(player);
  return cities <= greeneries ? weight : 0;
}
