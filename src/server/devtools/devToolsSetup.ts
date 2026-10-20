// DevTools: board and theme of a running game (common/devtools/devToolsAction.ts DevToolsSetupAction).
// The board decides spaces, maximums and scales, so it cannot be swapped inside the live game: the game is saved,
// gets the new board in its save and is built anew from it – the same way an undo restores a game.
import {IGame} from '../IGame';
import {Game} from '../Game';
import {GameSetup} from '../GameSetup';
import {SerializedGame} from '../SerializedGame';
import {SerializedSpace} from '../boards/SerializedBoard';
import {SpaceType} from '../../common/boards/SpaceType';
import {SeededRandom} from '../../common/utils/Random';
import {DevToolsSetupAction} from '../../common/devtools/devToolsAction';

function isOceanType(type: SpaceType): boolean {
  return type === SpaceType.OCEAN || type === SpaceType.COVE;
}

// A tile moves to the space with the same id when it may lie there: ocean spaces keep oceans, land keeps land tiles
function fits(previous: SerializedSpace, next: SerializedSpace): boolean {
  return previous.spaceType === next.spaceType || (isOceanType(previous.spaceType) && isOceanType(next.spaceType));
}

function moveToBoard(serialized: SerializedGame): number {
  // The same seed every time: the board of a game always comes out the same
  const board = GameSetup.newBoard(serialized.gameOptions, new SeededRandom(serialized.seed));
  const next = board.serialize();
  const previous = new Map(serialized.board.spaces.map((space) => [space.id, space]));
  let carried = 0;
  for (const space of next.spaces) {
    const old = previous.get(space.id);
    if (old?.tile !== undefined && fits(old, space)) {
      space.tile = old.tile;
      space.player = old.player;
      carried++;
    }
  }
  const tiles = serialized.board.spaces.filter((space) => space.tile !== undefined).length;
  const kept = new Set(next.spaces.filter((space) => space.tile !== undefined).map((space) => space.id));
  serialized.board = next;
  serialized.devToolsTiles = (serialized.devToolsTiles ?? []).filter((id) => kept.has(id));
  // The scales of the new board end where it says
  serialized.temperature = Math.min(serialized.temperature, board.max.temperature);
  serialized.oxygenLevel = Math.min(serialized.oxygenLevel, board.max.oxygen);
  return tiles - carried;
}

/** Returns the game built anew; the caller puts it in place of the old one (routes/ApiDevTools.ts) */
export function switchSetup(game: IGame, action: DevToolsSetupAction): IGame {
  // A copy: if building the new game fails, the running one stays untouched
  const serialized: SerializedGame = JSON.parse(JSON.stringify(game.serialize()));
  const options = serialized.gameOptions;
  const boardChanged = action.boardName !== undefined && action.boardName !== options.boardName;
  const themeChanged = action.theme !== undefined && action.theme !== options.theme;
  if (!boardChanged && !themeChanged) {
    return game;
  }
  let dropped = 0;
  if (action.theme !== undefined) {
    options.theme = action.theme;
  }
  if (boardChanged && action.boardName !== undefined) {
    options.boardName = action.boardName;
    dropped = moveToBoard(serialized);
  }
  const rebuilt = Game.deserialize(serialized);
  if (boardChanged) {
    rebuilt.log('🛠 DevTools: board changed to ${0} (${1} tiles did not fit)', (b) => b.string(options.boardName).number(dropped));
  }
  if (themeChanged) {
    rebuilt.log('🛠 DevTools: theme changed to ${0}', (b) => b.string(options.theme));
  }
  return rebuilt;
}
