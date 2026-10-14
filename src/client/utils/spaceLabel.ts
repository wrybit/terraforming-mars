import {GameModel} from '@/common/models/GameModel';
import {SpaceId} from '@/common/Types';
import {spacesById} from '@/client/utils/spacesById';

// Board coordinate of a space as the log shows it (moon spaces start with "m")
export function spaceLabel(game: GameModel, id: SpaceId): string {
  const spaces = id.startsWith('m') ? game.moon?.spaces : game.spaces;
  if (spaces === undefined) {
    return 'n/a';
  }
  return spacesById(spaces).get(id)?.a9 ?? 'n/a';
}
