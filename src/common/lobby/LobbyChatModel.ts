import {Color} from '../Color';

// Contract of the lobby chat between server (server/lobby/LobbyChat.ts, routes/ApiLobbyChat.ts) and client (LobbyChat.vue)

export const LOBBY_CHAT_MAX_LENGTH = 300;

export type LobbyChatMessage = {
  id: number;
  /** Milliseconds since 1970 */
  at: number;
  name: string;
  color: Color;
  emoji: string;
  text: string;
  /** Written by the asking participant */
  you: boolean;
};

export type LobbyChatModel = {
  messages: Array<LobbyChatMessage>;
};

/** Admin page: the words the chat masks (routes/ApiAdminChatWords.ts) */
export type ChatWordsModel = {
  words: Array<string>;
  /** The default set, for "Reset to default" */
  defaults: Array<string>;
};
