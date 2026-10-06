import {getSpaceName} from '@/common/boards/spaces';
import {SpaceId} from '@/common/Types';

// Coordinate shown in the "Coordinates" tile view; spaces without one (off-Mars spaces, "n/a") show nothing
export function spaceCoordinate(id: SpaceId): string | undefined {
  const name = getSpaceName(id);
  return name === 'n/a' ? undefined : name;
}
