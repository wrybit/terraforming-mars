// The server titles the action menu by the turn's step (Player.getActions): first or next action.
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

export function actionStep(input: PlayerInputModel): 1 | 2 | undefined {
  const title = typeof input.title === 'string' ? input.title : input.title.message;
  if (title === 'Take your first action') {
    return 1;
  }
  return title === 'Take your next action' ? 2 : undefined;
}
