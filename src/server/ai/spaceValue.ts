import {ICard} from '../cards/ICard';
import {CardName} from '../../common/cards/CardName';
import {TileType} from '../../common/TileType';
import {newCard} from '../createCard';
import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {SelectSpace} from '../inputs/SelectSpace';
import {SpaceBonus} from '../../common/boards/SpaceBonus';
import {SpaceType} from '../../common/boards/SpaceType';
import {remainingProductionPhases, victoryPointValue} from './gameProgress';
import {tuningOf} from './aiTuning';
import {citySpotPoints} from './citySpotPrior';

// Scores a hex for tile placement. Weights tuned in AI test batches.

/** cityNeighbour: tiles that score per adjacent city (Commercial District). */
export type TileKind = 'greenery' | 'city' | 'ocean' | 'cityNeighbour' | 'other';

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

/** The card named in a title like "Select space for Commercial District tile", if any. */
function cardOfTitle(input: SelectSpace): ICard | undefined {
  const title = input.title;
  if (typeof title === 'string') {
    return undefined;
  }
  for (const datum of title.data ?? []) {
    try {
      return newCard(String(datum.value) as CardName);
    } catch {
      // not a card name
    }
  }
  return undefined;
}

function kindOfCard(card: ICard): TileKind | undefined {
  const points = card.victoryPoints;
  if (typeof points === 'object' && points !== null && 'cities' in points && 'nextToThis' in points) {
    return 'cityNeighbour';
  }
  if (card.tilesBuilt.some((tile) => tile === TileType.CITY || tile === TileType.CAPITAL)) {
    return 'city';
  }
  return undefined;
}

/** Guesses which tile the input places; the engine does not expose it directly. */
export function tileKindOf(input: SelectSpace): TileKind {
  if (input.spaces.length > 0 && input.spaces.every((space) => space.spaceType === SpaceType.OCEAN)) {
    return 'ocean';
  }
  const card = cardOfTitle(input);
  const byCard = card === undefined ? undefined : kindOfCard(card);
  if (byCard !== undefined) {
    return byCard;
  }
  const text = titleText(input);
  // Special tiles whose title names a neighbour, not the tile: Ecological Zone ("next to
  // greenery for special tile") and Industrial Center ("adjacent to a city tile"). Read as a
  // greenery, Ecological Zone went next to the own Capital instead of between opponent cities.
  if (text.includes('special tile') || text.includes('adjacent to a city tile')) {
    return 'other';
  }
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

// Per other own city that touches a free spot next to a new city (aiTuning.ts sharedSpotShare):
// a greenery there scores for both. Three cities around one spot ("Triforce" in the group) make
// one greenery worth 3 VP. Per opponent city (opponentSpotShare): their greeneries there score
// for us too, and their Triforce is spoilt.

/** Value of the free spots around a new city for sharing greeneries with other cities, in VP. */
function sharedSpotPoints(space: Space, neighbours: ReadonlyArray<Space>, player: IPlayer, board: IGame['board']): number {
  let points = 0;
  for (const neighbour of neighbours) {
    if (neighbour.tile !== undefined || neighbour.spaceType !== SpaceType.LAND) {
      continue;
    }
    const cities = board.getAdjacentSpaces(neighbour).filter((next) => next !== space && Board.isCitySpace(next));
    const own = cities.filter((city) => city.player === player).length;
    const opponents = cities.filter((city) => city.player !== undefined && city.player !== player).length;
    const tuning = tuningOf(player);
    points += own * tuning.sharedSpotShare + opponents * tuning.opponentSpotShare;
  }
  return points;
}

/** Share of future board points (free spots still to fill) that can still be realised. */
function futureShare(player: IPlayer): number {
  return Math.min(1, remainingProductionPhases(player.game, player) / tuningOf(player).boardHorizon);
}

function opponentGreeneries(neighbours: ReadonlyArray<Space>, player: IPlayer): number {
  return neighbours.filter((neighbour) => Board.isGreenerySpace(neighbour) && neighbour.player !== undefined && neighbour.player !== player).length;
}

/** Opponent greeneries next to the free city spots that a city here closes (counted per spot). */
function blockedOpponentSpots(neighbours: ReadonlyArray<Space>, player: IPlayer, board: IGame['board']): number {
  let blocked = 0;
  for (const neighbour of neighbours) {
    if (neighbour.tile !== undefined || neighbour.spaceType !== SpaceType.LAND) {
      continue;
    }
    const around = board.getAdjacentSpaces(neighbour);
    if (around.some((next) => Board.isCitySpace(next))) {
      continue; // no city allowed there anyway
    }
    blocked += opponentGreeneries(around, player);
  }
  return blocked;
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
    // Greeneries already there score for sure; free land only if there is time to fill it.
    value += greeneries * victoryPoint + emptyLand * victoryPoint * 0.35 * futureShare(player);
    // Normally cities may not touch, only cards like Urbanized Area allow it. Such a city is an
    // attack: placed between opponent cities it takes their greenery spots, between own cities
    // it takes our own (the AI used to put it between its own cities).
    value += opponentCities * victoryPoint * 0.5 - ownCities * victoryPoint * 0.8;
    // Two own cities with one row between them share free spots: a greenery there scores for
    // both (tip from the group: place cities in pairs at that distance, then fill greeneries).
    value += sharedSpotPoints(space, neighbours, player, board) * victoryPoint * futureShare(player);
    // Opening: standard spots that score well in BGA games (citySpotPrior.ts).
    value += citySpotPoints(space, player) * tuningOf(player).citySpotPrior * victoryPoint;
    // A spot next to opponent greeneries is their best city spot: taking it denies them those
    // points (a human remarked the AI could have taken several such spots).
    // Cities may not touch: the free spots around a new city are closed for the opponent's cities
    // too. A human player set a city one spot off on purpose so the AI could no longer build next to it.
    value += (opponentGreeneries(neighbours, player) + blockedOpponentSpots(neighbours, player, board) * 0.5) *
      tuningOf(player).cityDenialShare * victoryPoint;
    break;
  case 'ocean':
    // Oceans next to own tiles help nobody else; next to free land they feed later rebates.
    value += ownTiles * 0.5;
    break;
  case 'cityNeighbour':
    // Commercial District: 1 VP per adjacent city of any owner. Needs at least two cities
    // around it; free spots where a city may still come count as half a chance (a test game
    // placed it with one city next to it).
    value += (ownCities + opponentCities) * victoryPoint + openCitySpots(neighbours, board) * victoryPoint * 0.4;
    break;
  case 'other':
    // Special tiles (Restricted Area, Nuclear Zone, Mining Area …) take a greenery spot away:
    // next to an opponent's city that costs them, next to an own city it costs us. Best between
    // several opponent cities, e.g. in the middle of their Triforce (3 cities around one spot).
    value += opponentCities * victoryPoint * 0.6 + Math.max(0, opponentCities - 1) * victoryPoint * 0.4 -
      ownCities * victoryPoint * 0.8;
    break;
  }
  return value;
}
