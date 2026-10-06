import {SpaceModel} from '../../common/models/SpaceModel';
import {MarsBoard} from './MarsBoard';

/** Spaces of an empty board as the client draws them (like ServerModel, without tiles and players). */
export function boardSpaceModels(board: MarsBoard): Array<SpaceModel> {
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
