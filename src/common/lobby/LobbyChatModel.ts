import {Color} from '../Color';

// Contract of the lobby chat between server (server/lobby/LobbyChat.ts, routes/ApiLobbyChat.ts) and client (LobbyChat.vue)

export const LOBBY_CHAT_MAX_LENGTH = 300;
/** Own messages can be corrected this long after sending; admins may edit every message at any time */
export const LOBBY_CHAT_EDIT_MS = 60 * 60 * 1000;

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
  /** The asking participant may change the text now (own message within LOBBY_CHAT_EDIT_MS, or admin) */
  editable: boolean;
  /** Changed by its author after sending (an admin's correction leaves no mark) */
  edited?: boolean;
};

export type LobbyChatModel = {
  messages: Array<LobbyChatMessage>;
  /** The asker is logged in on the admin page: may also delete messages */
  admin?: true;
};

/** Admin page: the words the chat masks (routes/ApiAdminChatWords.ts) */
export type ChatWordsModel = {
  words: Array<string>;
  /** The default set, for "Reset to default" */
  defaults: Array<string>;
};
