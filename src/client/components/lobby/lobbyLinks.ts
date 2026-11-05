import {LobbyRoomModel} from '@/common/lobby/LobbyModel';

/** The host's way back to the page with every player's link, when players were entered by hand (they need theirs) */
export function playerLinksHref(room: LobbyRoomModel): string | undefined {
  return room.hostNeedsLinks && room.gameId !== undefined ? 'game?id=' + room.gameId : undefined;
}

/** "Continue" into an own running game (list row and room dialog): the own player page */
export function continueHref(room: LobbyRoomModel): string | undefined {
  return room.state === 'started' && room.yourPlayerId !== undefined ? 'player?id=' + room.yourPlayerId : undefined;
}
