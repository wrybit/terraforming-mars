import {IGame} from '../IGame';
import {SpaceId} from '../../common/Types';

// Printed map coordinate of a space (e.g. 'D7'), taken from the board the space belongs to; 'n/a' for off-board spaces.
export function spaceName(game: IGame, id: SpaceId): string {
  const labels: Readonly<Partial<Record<SpaceId, string>>> | undefined = id.startsWith('m') ? game.moonData?.moon.A9 : game.board.A9;
  return labels?.[id] ?? 'n/a';
}
