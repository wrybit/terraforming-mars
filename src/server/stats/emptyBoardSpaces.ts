import {BoardName} from '../../common/boards/BoardName';
import {SpaceModel} from '../../common/models/SpaceModel';
import {SeededRandom} from '../../common/utils/Random';
import {DEFAULT_GAME_OPTIONS} from '../game/GameOptions';
import {GameSetup} from '../GameSetup';

/** Felder eines leeren Spielbretts, damit die Statistik das Brett so zeigen kann, wie es im Spiel aussieht. */
export function emptyBoardSpaces(boardName: BoardName): Array<SpaceModel> {
  // Fester Zufall: ohne "Brett mischen" sind die Boni ohnehin fest, so bleibt das Bild bei jedem Aufruf gleich
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
