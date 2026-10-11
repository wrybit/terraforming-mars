import {Message} from '../../common/logs/Message';
import {Space} from '../boards/Space';
import {InputResponse, isSelectSpaceResponse} from '../../common/inputs/InputResponse';
import {SelectSpaceModel, SelectSpaceTile} from '../../common/models/PlayerInputModel';
import {BasePlayerInput} from '../PlayerInput';
import {InputError} from './InputError';
import {toID} from '../../common/utils/utils';

export class SelectSpace extends BasePlayerInput<Space> {
  // Tile this selection places, sent to the client for label, color and image (special tiles of cards)
  public tile: SelectSpaceTile | undefined;

  constructor(
    title: string | Message,
    public spaces: ReadonlyArray<Space>) {
    super('space', title);
    if (spaces.length === 0) {
      throw new InputError('No available spaces');
    }
  }

  public placing(tile: SelectSpaceTile): this {
    this.tile = tile;
    return this;
  }

  public override toModel(): SelectSpaceModel {
    const model: SelectSpaceModel = {
      title: this.title,
      buttonLabel: this.buttonLabel,
      type: 'space',
      spaces: this.spaces.map(toID),
    };
    if (this.tile !== undefined) {
      model.tile = this.tile;
    }
    return model;
  }

  public process(input: InputResponse) {
    if (!isSelectSpaceResponse(input)) {
      throw new InputError('Not a valid SelectSpaceResponse');
    }
    const space = this.spaces.find((space) => space.id === input.spaceId);
    if (space === undefined) {
      throw new InputError('Space not available');
    }
    return this.cb(space);
  }
}
