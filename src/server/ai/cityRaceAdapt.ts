import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {tuningOf} from './aiTuning';

// Human opponents now put their cities next to the AI's greeneries on purpose (2.9 such cities per game) and end
// with almost twice the AI's cities. A fixed bonus for filling own nests lost (nestFill, round 152): while the AI is
// not behind in cities the spot is rarely taken. This only raises such spots while an opponent leads in cities –
// the AI then answers the city race on its own greeneries instead of leaving them as nests.

/** City lead (in cities) up to which the bonus grows. */
const MAXIMUM_LEAD = 3;
/** Own greeneries next to the spot that count. */
const MAXIMUM_GREENERIES = 3;
/** VP per own adjacent greenery and per city the leading opponent is ahead. */
const POINTS_PER_STEP = 0.25;

function citiesOf(player: IPlayer): number {
  return player.game.board.spaces.filter((space) => Board.isCitySpace(space) && space.player === player).length;
}

/** VP to add for an own city on this space: own adjacent greeneries × the best opponent's city lead. */
export function cityRaceBonus(space: Space, player: IPlayer): number {
  const weight = tuningOf(player).cityRaceAdapt;
  if (weight <= 0) {
    return 0;
  }
  const own = citiesOf(player);
  const lead = Math.max(0, ...player.opponents.map((opponent) => citiesOf(opponent) - own));
  if (lead <= 0) {
    return 0;
  }
  const greeneries = player.game.board.getAdjacentSpaces(space)
    .filter((neighbour) => Board.isGreenerySpace(neighbour) && neighbour.player === player).length;
  return weight * POINTS_PER_STEP * Math.min(MAXIMUM_GREENERIES, greeneries) * Math.min(MAXIMUM_LEAD, lead);
}
