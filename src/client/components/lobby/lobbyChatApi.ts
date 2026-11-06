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

export type ChatTextPart = {text: string, href?: string, tag?: true};

// A hashtag starts at the beginning or after white space, so "#" inside a word or an address stays plain text
const TAG_PATTERN = /(^|\s)(#[\p{L}\p{N}_-]+)/gu;

// Plain text split into text and hashtags (#looking-for-game); the tags only look different, they do nothing
function withTags(text: string): Array<ChatTextPart> {
  const parts: Array<ChatTextPart> = [];
  let rest = 0;
  for (const match of text.matchAll(TAG_PATTERN)) {
    const start = (match.index ?? 0) + match[1].length;
    if (start > rest) {
      parts.push({text: text.slice(rest, start)});
    }
    parts.push({text: match[2], tag: true});
    rest = start + match[2].length;
  }
  if (rest < text.length) {
    parts.push({text: text.slice(rest)});
  }
  return parts;
}

/** Text split into plain parts, hashtags and links to this server (the only links the server lets through) */
export function chatTextParts(text: string, origin: string = window.location.origin): Array<ChatTextPart> {
  const parts: Array<ChatTextPart> = [];
  let rest = text;
  const pattern = /https?:\/\/[^\s]+/i;
  for (let match = pattern.exec(rest); match !== null; match = pattern.exec(rest)) {
    if (match.index > 0) {
      parts.push(...withTags(rest.slice(0, match.index)));
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
    parts.push(...withTags(rest));
  }
  return parts;
}
