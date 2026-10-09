import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {BoardName} from '../../common/boards/BoardName';
import {getSpaceName} from '../../common/boards/spaces';
import citySpots from './data/bgaCitySpotsTharsis.json';

// Opening city spots from 46 477 Tharsis two-player games on BGA (tests/simulation/
// analyzeBgaCitySpots.py): average end score of a city on each spot. Jens noticed the AI kept
// opening next to Noctis City although the common standard spots score more (D7 3.8, G4 4.0,
// C5 3.7 against E2 3.0). Only for the first cities of a player and only on Tharsis.

/** Cities with fewer samples are too noisy to judge the spot. */
const MINIMUM_CITIES = 200;
/** The prior helps with the opening; later the actual board decides. */
const OPENING_CITIES = 2;

type SpotStatistics = {meanPoints: number, cities: number};
const spots = (citySpots as {spots: Record<string, SpotStatistics>}).spots;
const known = Object.values(spots).filter((spot) => spot.cities >= MINIMUM_CITIES);
const averagePoints = known.reduce((sum, spot) => sum + spot.meanPoints, 0) / Math.max(1, known.length);

/** VP a city on this spot scores above (or below) the average spot, 0 outside the opening. */
export function citySpotPoints(space: Space, player: IPlayer): number {
  if (player.game.gameOptions.boardName !== BoardName.THARSIS) {
    return 0;
  }
  const ownCities = player.game.board.spaces.filter((other) => Board.isCitySpace(other) && other.player === player).length;
  if (ownCities >= OPENING_CITIES) {
    return 0;
  }
  const spot = spots[getSpaceName(space.id)];
  if (spot === undefined || spot.cities < MINIMUM_CITIES) {
    return 0;
  }
  return spot.meanPoints - averagePoints;
}
