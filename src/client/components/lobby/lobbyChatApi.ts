import {paths} from '@/common/app/paths';
import {LobbyChatModel} from '@/common/lobby/LobbyChatModel';
import {LobbyProfile} from '@/common/lobby/LobbyModel';
import {fetchOrFail} from '@/client/utils/requestFailure';
import {lobbyParticipantId} from './lobbyProfile';

// Requests of the lobby chat (server: routes/ApiLobbyChat.ts)

export async function fetchLobbyChat(): Promise<LobbyChatModel> {
  const response = await fetchOrFail(`${paths.API_LOBBY_CHAT}?${new URLSearchParams({me: lobbyParticipantId()}).toString()}`);
  return response.json();
}

export async function postLobbyChat(profile: LobbyProfile, text: string): Promise<LobbyChatModel> {
  const response = await fetchOrFail(paths.API_LOBBY_CHAT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({me: lobbyParticipantId(), profile: {name: profile.name, color: profile.color, emoji: profile.emoji}, text}),
  });
  return response.json();
}

/** Changes the text of a message (own within the hour, any as admin: the server decides) */
export async function editLobbyChat(id: number, text: string): Promise<LobbyChatModel> {
  const response = await fetchOrFail(paths.API_LOBBY_CHAT, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({me: lobbyParticipantId(), id, text}),
  });
  return response.json();
}

/** Text split into plain parts and links to this server (the only links the server lets through) */
export function chatTextParts(text: string, origin: string = window.location.origin): Array<{text: string, href?: string}> {
  const parts: Array<{text: string, href?: string}> = [];
  let rest = text;
  const pattern = /https?:\/\/[^\s]+/i;
  for (let match = pattern.exec(rest); match !== null; match = pattern.exec(rest)) {
    if (match.index > 0) {
      parts.push({text: rest.slice(0, match.index)});
    }
    const link = match[0];
    let sameServer = false;
    try {
      sameServer = new URL(link).origin === origin;
    } catch {
      // Not a readable address: stays text
    }
    parts.push(sameServer ? {text: link, href: link} : {text: link});
    rest = rest.slice(match.index + link.length);
  }
  if (rest !== '') {
    parts.push({text: rest});
  }
  return parts;
}
