// DevTools: fills the planet with tiles (common/devtools/devToolsAction.ts DevToolsTerraformAction, DevToolsOceansAction).
// The spaces follow the normal placement rules (oceans on ocean spaces, cities apart, greeneries next to own tiles);
// only where the rules leave no space – a full planet – any free space is taken. Tiles are set directly, without
// bonuses or terraform rating, and only tiles placed this way are taken away again (game.devToolsTiles), so turning
// the slider back never removes what players built.
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {SpaceType} from '../../common/boards/SpaceType';
import {TileType} from '../../common/TileType';
import {DevToolsOceansAction, DevToolsTerraformAction} from '../../common/devtools/devToolsAction';

type Kind = 'greenery' | 'city' | 'special';
// Two cities and one special tile in every eight land tiles: the mix of a played game
const KIND_CYCLE: ReadonlyArray<Kind> = ['greenery', 'city', 'greenery', 'greenery', 'special', 'greenery', 'city', 'greenery'];
const SPECIAL_TILES: ReadonlyArray<TileType> = [
  TileType.NATURAL_PRESERVE, TileType.ECOLOGICAL_ZONE, TileType.INDUSTRIAL_CENTER, TileType.COMMERCIAL_DISTRICT,
  TileType.NUCLEAR_ZONE, TileType.RESTRICTED_AREA, TileType.MINING_AREA,
];

type Count = {placed: number, removed: number};

// Fixed order per game: the planet fills evenly instead of row by row, and the same share gives the same picture
function scattered(spaces: ReadonlyArray<Space>, seed: string): Array<Space> {
  const rank = (id: string) => {
    let value = 7;
    for (const char of seed + id) {
      value = (value * 31 + char.charCodeAt(0)) % 2147483647;
    }
    return value;
  };
  return [...spaces].sort((a, b) => rank(a.id) - rank(b.id));
}

function isOceanSpace(space: Space): boolean {
  return space.spaceType === SpaceType.OCEAN || space.spaceType === SpaceType.COVE;
}

function isFree(space: Space): boolean {
  return space.tile === undefined && space.player === undefined && space.cube === undefined;
}

function place(game: IGame, space: Space, tileType: TileType, player: IPlayer | undefined): void {
  space.tile = {tileType};
  space.player = player;
  game.devToolsTiles.push(space.id);
}

function remove(game: IGame, space: Space): void {
  space.tile = undefined;
  space.player = undefined;
  game.devToolsTiles = game.devToolsTiles.filter((id) => id !== space.id);
}

// Own tiles, the last placed first: taking them back undoes the filling in reverse
function ownSpaces(game: IGame, filter: (space: Space) => boolean): Array<Space> {
  return game.devToolsTiles
    .map((id) => game.board.getSpaceOrThrow(id))
    .filter(filter)
    .reverse();
}

function oceanCount(game: IGame): number {
  return game.board.getOceanSpaces().length;
}

// Oceans only on ocean spaces, up to the maximum of the board. A space a full planet filled with land is cleared first
function setOceans(game: IGame, wanted: number, count: Count): void {
  const target = Math.max(0, Math.min(wanted, game.max.oceans));
  for (const space of scattered(game.board.spaces.filter(isOceanSpace), game.id)) {
    if (oceanCount(game) >= target) {
      break;
    }
    if (space.tile !== undefined && game.devToolsTiles.includes(space.id) && space.tile.tileType !== TileType.OCEAN) {
      remove(game, space);
      count.removed++;
    }
    if (isFree(space)) {
      place(game, space, TileType.OCEAN, undefined);
      count.placed++;
    }
  }
  for (const space of ownSpaces(game, (space) => space.tile?.tileType === TileType.OCEAN)) {
    if (oceanCount(game) <= target) {
      break;
    }
    remove(game, space);
    count.removed++;
  }
}

function landSpaces(game: IGame): Array<Space> {
  return game.board.spaces.filter((space) => space.spaceType === SpaceType.LAND);
}

// Land the rules allow for a tile: no space reserved for a card (Noctis City) or for the nomads
function freeLand(game: IGame): Array<Space> {
  return scattered(landSpaces(game), game.id).filter((space) =>
    isFree(space) && space.id !== game.board.noctisCitySpaceId && space.id !== game.nomadSpace);
}

function nextTo(game: IGame, space: Space, test: (adjacent: Space) => boolean): boolean {
  return game.board.getAdjacentSpaces(space).some(test);
}

// Where the rules let this kind go; an empty list means the rules leave no space
function legalSpaces(game: IGame, kind: Kind, tileType: TileType, player: IPlayer): Array<Space> {
  const free = freeLand(game);
  switch (kind) {
  case 'city':
    return free.filter((space) => !nextTo(game, space, (adjacent) => Board.isCitySpace(adjacent)));
  case 'greenery': {
    // Next to an own tile whenever there is such a space, otherwise anywhere
    const nearOwn = free.filter((space) => nextTo(game, space, (adjacent) => adjacent.tile !== undefined && adjacent.player === player));
    return nearOwn.length > 0 ? nearOwn : free;
  }
  case 'special':
    switch (tileType) {
    case TileType.NATURAL_PRESERVE:
      return free.filter((space) => !nextTo(game, space, (adjacent) => adjacent.tile !== undefined));
    case TileType.ECOLOGICAL_ZONE:
      return free.filter((space) => nextTo(game, space, (adjacent) => adjacent.tile?.tileType === TileType.GREENERY));
    case TileType.INDUSTRIAL_CENTER:
    case TileType.COMMERCIAL_DISTRICT:
      return free.filter((space) => nextTo(game, space, (adjacent) => Board.isCitySpace(adjacent)));
    default:
      return free;
    }
  }
}

function placeLand(game: IGame, ordinal: number): boolean {
  const kind = KIND_CYCLE[ordinal % KIND_CYCLE.length];
  const tileType = kind === 'city' ? TileType.CITY :
    kind === 'greenery' ? TileType.GREENERY :
      SPECIAL_TILES[Math.floor(ordinal / KIND_CYCLE.length) % SPECIAL_TILES.length];
  const player = game.players[ordinal % game.players.length];
  // No rule-conforming space left for this kind: a greenery by its rules, and else any free land
  const space = legalSpaces(game, kind, tileType, player)[0];
  if (space !== undefined) {
    place(game, space, tileType, player);
    return true;
  }
  const fallback = legalSpaces(game, 'greenery', TileType.GREENERY, player)[0];
  if (fallback !== undefined) {
    place(game, fallback, TileType.GREENERY, player);
    return true;
  }
  return false;
}

function isLandTile(space: Space): boolean {
  return space.spaceType === SpaceType.LAND && space.tile !== undefined;
}

function setLand(game: IGame, share: number, count: Count): void {
  const land = landSpaces(game);
  const taken = () => land.filter((space) => space.tile !== undefined).length;
  const target = Math.round(share * land.length);
  let ordinal = ownSpaces(game, isLandTile).length;
  while (taken() < target && placeLand(game, ordinal)) {
    ordinal++;
    count.placed++;
  }
  for (const space of ownSpaces(game, isLandTile)) {
    if (taken() <= target) {
      break;
    }
    remove(game, space);
    count.removed++;
  }
}

// A full planet: every space still free gets a tile – ocean spaces beyond the maximum and reserved land a greenery,
// so nothing is left open. Below full these extras go first.
function fillRest(game: IGame, full: boolean, count: Count): void {
  const isExtra = (space: Space) => (isOceanSpace(space) && space.tile?.tileType !== TileType.OCEAN) ||
    (space.spaceType === SpaceType.LAND && (space.id === game.board.noctisCitySpaceId || space.id === game.nomadSpace));
  if (!full) {
    for (const space of ownSpaces(game, (space) => space.tile !== undefined && isExtra(space))) {
      remove(game, space);
      count.removed++;
    }
    return;
  }
  const rest = scattered(game.board.spaces.filter((space) =>
    (isOceanSpace(space) || space.spaceType === SpaceType.LAND) && isFree(space)), game.id);
  rest.forEach((space, index) => {
    place(game, space, TileType.GREENERY, game.players[index % game.players.length]);
    count.placed++;
  });
}

export function applyTerraform(game: IGame, action: DevToolsTerraformAction): void {
  const count: Count = {placed: 0, removed: 0};
  const full = action.share >= 1;
  if (!full) {
    fillRest(game, false, count);
  }
  setOceans(game, Math.round(action.share * game.max.oceans), count);
  setLand(game, action.share, count);
  if (full) {
    fillRest(game, true, count);
  }
  game.log('🛠 DevTools: planet filled to ${0} % (${1} tiles placed, ${2} removed)',
    (b) => b.number(Math.round(action.share * 100)).number(count.placed).number(count.removed));
}

export function applyOceans(game: IGame, action: DevToolsOceansAction): void {
  const count: Count = {placed: 0, removed: 0};
  setOceans(game, action.count, count);
  game.log('🛠 DevTools: oceans set to ${0}', (b) => b.number(oceanCount(game)));
}
