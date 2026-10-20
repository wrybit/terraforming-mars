// DevTools: fills the planet with tiles by one share (common/devtools/devToolsAction.ts DevToolsTerraformAction).
// Tiles are set directly (no bonuses, no rules), and only tiles placed this way are taken away again
// (game.devToolsTiles), so turning the share back never removes what players built.
import {IGame} from '../IGame';
import {Space} from '../boards/Space';
import {SpaceType} from '../../common/boards/SpaceType';
import {TileType} from '../../common/TileType';
import {SpaceId} from '../../common/Types';
import {DevToolsTerraformAction} from '../../common/devtools/devToolsAction';

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

function remove(game: IGame, space: Space): void {
  space.tile = undefined;
  space.player = undefined;
  game.devToolsTiles = game.devToolsTiles.filter((id) => id !== space.id);
}

export function applyTerraform(game: IGame, action: DevToolsTerraformAction): void {
  const board = game.board;
  const placedHere = new Set<SpaceId>(game.devToolsTiles);
  let placed = 0;
  let removed = 0;

  // Oceans: the share of the maximum
  const oceanTarget = Math.round(action.share * game.max.oceans);
  const freeOceanSpaces = scattered(board.spaces.filter((space) => isOceanSpace(space) && space.tile === undefined), game.id);
  for (const space of freeOceanSpaces) {
    if (board.getOceanSpaces().length >= oceanTarget) {
      break;
    }
    space.tile = {tileType: TileType.OCEAN};
    space.player = undefined;
    game.devToolsTiles.push(space.id);
    placed++;
  }
  const ownOceans = board.spaces.filter((space) => isOceanSpace(space) && placedHere.has(space.id) && space.tile !== undefined).reverse();
  for (const space of ownOceans) {
    if (board.getOceanSpaces().length <= oceanTarget) {
      break;
    }
    remove(game, space);
    removed++;
  }

  // Land: the share of all land spaces that are free or filled by the DevTools; two greeneries per city,
  // owners in turn, so every player colour shows
  const landSpaces = scattered(board.spaces.filter((space) => space.spaceType === SpaceType.LAND &&
    (space.tile === undefined || placedHere.has(space.id))), game.id);
  const landTarget = Math.round(action.share * landSpaces.length);
  const ownLand = landSpaces.filter((space) => space.tile !== undefined);
  landSpaces.forEach((space, index) => {
    if (index < landTarget && space.tile === undefined) {
      space.tile = {tileType: index % 3 === 2 ? TileType.CITY : TileType.GREENERY};
      space.player = game.players[index % game.players.length];
      game.devToolsTiles.push(space.id);
      placed++;
    }
  });
  for (const space of ownLand) {
    if (landSpaces.indexOf(space) >= landTarget) {
      remove(game, space);
      removed++;
    }
  }

  game.log('🛠 DevTools: planet filled to ${0} % (${1} tiles placed, ${2} removed)',
    (b) => b.number(Math.round(action.share * 100)).number(placed).number(removed));
}
