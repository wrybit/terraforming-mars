import {BoardName} from '../../common/boards/BoardName';
import {SpaceModel} from '../../common/models/SpaceModel';
import {SeededRandom} from '../../common/utils/Random';
import {DEFAULT_GAME_OPTIONS} from '../game/GameOptions';
import {GameSetup} from '../GameSetup';

/** Spaces of an empty game board, so the statistics can show the board as it looks in the game. */
export function emptyBoardSpaces(boardName: BoardName): Array<SpaceModel> {
  // Fixed randomness: without "shuffle board" the bonuses are fixed anyway, so the image stays the same on every call
  const board = GameSetup.newBoard({...DEFAULT_GAME_OPTIONS, boardName}, new SeededRandom(0));
  return board.spaces.map((space) => {
    const model: SpaceModel = {id: space.id, x: space.x, y: space.y, spaceType: space.spaceType, bonus: space.bonus};
    if (space.volcanic) {
      model.highlight = 'volcanic';
    } else if (space.id === board.noctisCitySpaceId) {
      model.highlight = 'noctis';
    }
    return model;
  });
}
