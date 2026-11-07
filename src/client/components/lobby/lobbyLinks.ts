import {LobbyRoomModel} from '@/common/lobby/LobbyModel';

/** "Continue" into an own running game (list row and room dialog): the own player page */
export function continueHref(room: LobbyRoomModel): string | undefined {
  return room.state === 'started' && room.yourPlayerId !== undefined ? 'player?id=' + room.yourPlayerId : undefined;
}
