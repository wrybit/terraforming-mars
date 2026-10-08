import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {SelectSpace} from '../inputs/SelectSpace';
import {SpaceBonus} from '../../common/boards/SpaceBonus';
import {SpaceType} from '../../common/boards/SpaceType';
import {victoryPointValue} from './gameProgress';

// Scores a hex for tile placement. Weights: docs/ai/bot-heuristics.md §5.

export type TileKind = 'greenery' | 'city' | 'ocean' | 'other';

const BONUS_VALUE: Partial<Record<SpaceBonus, number>> = {
  [SpaceBonus.TITANIUM]: 3,
  [SpaceBonus.STEEL]: 2,
  [SpaceBonus.PLANT]: 2,
  [SpaceBonus.DRAW_CARD]: 3,
  [SpaceBonus.HEAT]: 1,
  [SpaceBonus.MEGACREDITS]: 1,
  [SpaceBonus.ENERGY]: 1,
};
const OCEAN_ADJACENCY_VALUE = 2;

function titleText(input: SelectSpace): string {
  const title = input.title;
  if (typeof title === 'string') {
    return title.toLowerCase();
  }
  const data = (title.data ?? []).map((datum) => String(datum.value)).join(' ');
  return `${title.message} ${data}`.toLowerCase();
}

/** Guesses which tile the input places; the engine does not expose it directly. */
export function tileKindOf(input: SelectSpace): TileKind {
  if (input.spaces.length > 0 && input.spaces.every((space) => space.spaceType === SpaceType.OCEAN)) {
    return 'ocean';
  }
  const text = titleText(input);
  if (text.includes('greenery')) {
    return 'greenery';
  }
  if (text.includes('city')) {
    return 'city';
  }
  if (text.includes('ocean')) {
    return 'ocean';
  }
  return 'other';
}

/** Free land next to the space where a city may still be placed (no city next to it). */
function openCitySpots(neighbours: ReadonlyArray<Space>, board: IGame['board']): number {
  return neighbours.filter((neighbour) =>
    neighbour.tile === undefined && neighbour.spaceType === SpaceType.LAND &&
    !board.getAdjacentSpaces(neighbour).some((next) => Board.isCitySpace(next)),
  ).length;
}

const SHARED_SPOT_SHARE = 0.4;

/** Free land next to the space that also touches another own city. */
function sharedGreenerySpots(space: Space, neighbours: ReadonlyArray<Space>, player: IPlayer, board: IGame['board']): number {
  return neighbours.filter((neighbour) =>
    neighbour.tile === undefined && neighbour.spaceType === SpaceType.LAND &&
    board.getAdjacentSpaces(neighbour).some((next) => next !== space && Board.isCitySpace(next) && next.player === player),
  ).length;
}

export function spaceValue(space: Space, kind: TileKind, player: IPlayer): number {
  const game = player.game;
  const board = game.board;
  const victoryPoint = victoryPointValue(game);
  let value = space.bonus.reduce((sum, bonus) => sum + (BONUS_VALUE[bonus] ?? 1), 0);
  const neighbours = board.getAdjacentSpaces(space);
  value += neighbours.filter((neighbour) => Board.isOceanSpace(neighbour)).length * OCEAN_ADJACENCY_VALUE;

  const ownCities = neighbours.filter((neighbour) => Board.isCitySpace(neighbour) && neighbour.player === player).length;
  const opponentCities = neighbours.filter((neighbour) => Board.isCitySpace(neighbour) && neighbour.player !== undefined && neighbour.player !== player).length;
  const emptyLand = neighbours.filter((neighbour) => neighbour.tile === undefined && neighbour.spaceType === SpaceType.LAND).length;
  const greeneries = neighbours.filter((neighbour) => Board.isGreenerySpace(neighbour)).length;
  const ownTiles = neighbours.filter((neighbour) => neighbour.player === player).length;

  switch (kind) {
  case 'greenery':
    // Each adjacent city scores 1 VP for its owner, so a greenery next to an opponent's city is
    // a full VP for them (the AI used to hand out these points).
    // Feeding an opponent's city counts extra: it also makes their spot safe.
    value += ownCities * victoryPoint - opponentCities * victoryPoint * 1.5;
    // A greenery without an own city is mostly lost points, and every free spot next to it
    // where a city is still allowed invites the opponent to build there.
    if (ownCities === 0) {
      value -= victoryPoint;
    }
    value -= openCitySpots(neighbours, board) * victoryPoint * 0.6;
    value += ownTiles * 0.5;
    break;
  case 'city':
    // A city scores 1 VP per adjacent greenery (any owner) at game end; free land can become one.
    value += greeneries * victoryPoint + emptyLand * victoryPoint * 0.35;
    // Normally cities may not touch, only cards like Urbanized Area allow it. Such a city is an
    // attack: placed between opponent cities it takes their greenery spots, between own cities
    // it takes our own (the AI used to put it between its own cities).
    value += opponentCities * victoryPoint * 0.5 - ownCities * victoryPoint * 0.8;
    // Two own cities with one row between them share free spots: a greenery there scores for
    // both (tip from the group: place cities in pairs at that distance, then fill greeneries).
    value += sharedGreenerySpots(space, neighbours, player, board) * victoryPoint * SHARED_SPOT_SHARE;
    break;
  case 'ocean':
    // Oceans next to own tiles help nobody else; next to free land they feed later rebates.
    value += ownTiles * 0.5;
    break;
  case 'other':
    // Special tiles (Restricted Area, Nuclear Zone, Mining Area …) take a greenery spot away:
    // next to an opponent's city that costs them, next to an own city it costs us.
    value += opponentCities * victoryPoint * 0.6 - ownCities * victoryPoint * 0.8;
    break;
  }
  return value;
}
