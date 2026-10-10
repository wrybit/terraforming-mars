import {IPlayer} from '../IPlayer';
import {Board} from '../boards/Board';
import {SpaceType} from '../../common/boards/SpaceType';

// Last generation: free land is scarce and every spot left open is filled by whoever can still
// pay for a greenery. In a human test game the AI passed with 47 M€ next to three free spots
// (2 greeneries affordable); the human then bought greeneries there next to his cities. The board
// potential of later generations is 0 in the last one, so the AI did not see this.

const GREENERY_PROJECT_COST = 23;

/** Greeneries a player can still place this generation: plants always, money only before passing. */
function affordableGreeneries(player: IPlayer): number {
  const fromPlants = Math.floor(player.plants / Math.max(1, player.plantsNeededForGreenery));
  const fromMoney = player.game.hasPassedThisActionPhase(player) ? 0 : Math.floor(player.megaCredits / GREENERY_PROJECT_COST);
  return fromPlants + fromMoney;
}

/**
 * VP a player can still make this generation on the free land: the best affordable spots, each a
 * greenery (1 VP) plus 1 VP for every own city next to it.
 */
export function lastGenerationSpotPoints(player: IPlayer): number {
  const affordable = affordableGreeneries(player);
  if (affordable === 0) {
    return 0;
  }
  const board = player.game.board;
  const gains = board.spaces
    .filter((space) => space.tile === undefined && space.spaceType === SpaceType.LAND)
    .map((space) => 1 + board.getAdjacentSpaces(space).filter((neighbour) => Board.isCitySpace(neighbour) && neighbour.player === player).length)
    .sort((a, b) => b - a);
  return gains.slice(0, affordable).reduce((sum, gain) => sum + gain, 0);
}
