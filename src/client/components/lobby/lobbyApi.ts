import {paths} from '@/common/app/paths';
import {LobbyAction, LobbyListModel, LobbyRoomModel} from '@/common/lobby/LobbyModel';
import {fetchOrFail} from '@/client/utils/requestFailure';
import {lobbyParticipantId} from './lobbyProfile';

// Requests of the lobby page (server: routes/ApiLobby.ts). Listing doubles as the heartbeat that keeps the own seat.

export async function fetchLobby(roomId?: string): Promise<LobbyListModel> {
  const params = new URLSearchParams({me: lobbyParticipantId()});
  if (roomId !== undefined) {
    params.set('room', roomId);
  }
  const response = await fetchOrFail(`${paths.API_LOBBY}?${params.toString()}`);
  return response.json();
}

/** A lobby action without the participant id, which this module adds */
export type LobbyRequest = LobbyAction extends infer A ? A extends {me: string} ? Omit<A, 'me'> : never : never;

export async function lobbyAction(action: LobbyRequest): Promise<LobbyRoomModel | undefined> {
  const response = await fetchOrFail(paths.API_LOBBY, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({...action, me: lobbyParticipantId()}),
  });
  const json = await response.json();
  return json?.id === undefined ? undefined : json;
}
