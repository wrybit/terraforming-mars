import {paths} from '@/common/app/paths';
import {LobbyAction, LobbyListModel, LobbyRoomModel} from '@/common/lobby/LobbyModel';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';
import {translateText} from '@/client/directives/i18n';
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

/**
 * Text for a failed lobby or chat request. The lobby's own refusals (full, foreign link, too many messages) come as
 * a bad request with a short text that has a translation; the server writes "Bad request: " in front of it.
 */
export function lobbyFailureText(error: unknown): string {
  const failure = failureOf(error);
  return failure.kind === 'http' && failure.status === 400 ? translateText(failure.serverText.replace(/^Bad request:\s*/i, '')) : describeFailure(failure);
}
