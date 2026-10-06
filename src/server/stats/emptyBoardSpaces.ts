import {BoardName} from '../../common/boards/BoardName';
import {SpaceType} from '../../common/boards/SpaceType';
import {SpaceModel} from '../../common/models/SpaceModel';
import {RANDOM_BOARD, StatsBoardKey} from '../../common/stats/statsBoardKey';
import {SeededRandom} from '../../common/utils/Random';
import {DEFAULT_GAME_OPTIONS} from '../game/GameOptions';
import {GameSetup} from '../GameSetup';
import {boardSpaceModels} from '../boards/boardSpaceModels';

/** Spaces of an empty game board, so the statistics can show the board as it looks in the game. */
export function emptyBoardSpaces(boardKey: StatsBoardKey): Array<SpaceModel> {
  if (boardKey === RANDOM_BOARD) {
    return neutralSpaces();
  }
  // Fixed randomness: without "shuffle board" the bonuses are fixed anyway, so the image stays the same on every call
  return boardSpaceModels(GameSetup.newBoard({...DEFAULT_GAME_OPTIONS, boardName: boardKey}, new SeededRandom(0)));
}

/**
 * Shuffled boards: oceans and bonuses lie elsewhere in every game, so only the hex grid itself is common to them.
 * Every Mars space is shown as plain land without bonus; the spaces off Mars (colonies) stay as they are.
 */
function neutralSpaces(): Array<SpaceModel> {
  return emptyBoardSpaces(BoardName.THARSIS).map((space) => space.spaceType === SpaceType.COLONY ?
    space :
    {id: space.id, x: space.x, y: space.y, spaceType: SpaceType.LAND, bonus: []});
}
