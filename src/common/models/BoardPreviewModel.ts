import {BoardName} from '../boards/BoardName';
import {SpaceModel} from './SpaceModel';

/** Board of a game that is about to be created (preview on the "Create game" page). */
export type BoardPreviewModel = {
  boardName: BoardName;
  spaces: Array<SpaceModel>;
};
