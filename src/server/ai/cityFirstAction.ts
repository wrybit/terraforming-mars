import {IPlayer} from '../IPlayer';
import {OrOptions} from '../inputs/OrOptions';
import {SelectSpace} from '../inputs/SelectSpace';
import {InputResponse} from '../../common/inputs/InputResponse';
import {CardName} from '../../common/cards/CardName';
import {TileType} from '../../common/TileType';
import {Board} from '../boards/Board';
import {tuningOf} from './aiTuning';
import {remainingProductionPhases, victoryPointValue} from './gameProgress';
import {ownTileCounts} from './cityFirst';
import {hoardingWithoutCityPlan} from './plantHoardDecay';

// cityFirst (spaceValue.ts) only chose a better space for a greenery and left the order unchanged: greeneries placed
// while own cities led stayed at 15 % (humans 29 %). The order is decided by the move itself – converting plants or
// building a city. Plants do not spoil, so a greenery without an own city next to it can wait one turn for the city
// that lets it score twice (greenery point + city point); a city move goes first while cities do not lead.

const CONVERT_PLANTS_TITLE = 'Convert ${0} plants into greenery';

function titleOf(option: {title: string | {message: string}}): string {
  return typeof option.title === 'string' ? option.title : option.title.message;
}

/** True while the rule applies: on, not the last generation, cities do not lead greeneries, a city spot is free. */
function cityFirstActive(player: IPlayer): boolean {
  if (tuningOf(player).cityFirstAction <= 0 || remainingProductionPhases(player.game, player) <= 0) {
    return false;
  }
  // plantHoardDecay: with no city coming, waiting for one only piles up plants (human game: 61 plants, no city).
  if (hoardingWithoutCityPlan(player)) {
    return false;
  }
  const {cities, greeneries} = ownTileCounts(player);
  return cities <= greeneries && player.game.board.getAvailableSpacesForCity(player).length > 0;
}

/** True when the move places a city: the city standard project or a hand card that builds a city tile. */
function isCityMove(player: IPlayer, response: InputResponse): boolean {
  const inner = response.type === 'or' ? response.response : undefined;
  if (inner?.type !== 'projectCard') {
    return false;
  }
  if (inner.card === CardName.CITY_STANDARD_PROJECT) {
    return true;
  }
  const card = player.cardsInHand.find((handCard) => handCard.name === inner.card);
  return card !== undefined && card.tilesBuilt.includes(TileType.CITY);
}

/** True when the move converts plants into a greenery with no own city next to it. */
function isLonelyPlantGreenery(menu: OrOptions, player: IPlayer, response: InputResponse): boolean {
  const option = response.type === 'or' ? menu.options[response.index] : undefined;
  const inner = response.type === 'or' ? response.response : undefined;
  if (!(option instanceof SelectSpace) || titleOf(option) !== CONVERT_PLANTS_TITLE || inner?.type !== 'space') {
    return false;
  }
  const board = player.game.board;
  const space = board.getSpaceOrThrow(inner.spaceId);
  return !board.getAdjacentSpaces(space).some((neighbour) => neighbour.player === player && Board.isCitySpace(neighbour));
}

/**
 * M€ added to a move's value: minus cityFirstAction VP for converting plants into a greenery without an own city next
 * to it, plus half of that for a city move – both only while own cities do not lead own greeneries.
 */
export function cityFirstActionAdjustment(player: IPlayer, menu: OrOptions, response: InputResponse): number {
  if (!cityFirstActive(player)) {
    return 0;
  }
  const weight = tuningOf(player).cityFirstAction * victoryPointValue(player.game, player);
  if (isLonelyPlantGreenery(menu, player, response)) {
    return -weight;
  }
  return isCityMove(player, response) ? weight / 2 : 0;
}
