import {LOBBY_CHAT_EDIT_MS, LOBBY_CHAT_MAX_LENGTH, LobbyChatMessage, LobbyChatModel} from '../../common/lobby/LobbyChatModel';
import {LobbyProfile} from '../../common/lobby/LobbyModel';
import {hasForeignLink} from './chatLinks';
import {ChatWordList, maskWords} from './chatWords';
import {fileStorage, LobbyStorage} from './lobbyStorage';
import {LobbyError, sanitizeProfile} from './lobbyValidation';
import * as path from 'path';

/**
 * Obergrenze des Chats: Nachrichten verfallen nicht nach Zeit, sondern erst, wenn es mehr werden –
 * dann verdrängt jede neue Nachricht die älteste. So bleibt auch ein ruhiger Chat lesbar.
 */
export const CHAT_KEEP_MESSAGES = 100;
/** Against flooding: at most this many messages per participant within the window */
export const CHAT_RATE_LIMIT = 5;
export const CHAT_RATE_WINDOW_MS = 15_000;

type StoredMessage = Omit<LobbyChatMessage, 'you' | 'editable'> & {participant: string};

export function lobbyChatFile(): string {
  return process.env.LOBBY_CHAT_FILE ?? path.resolve('db', 'lobby-chat.json');
}

/** Chat of the lobby page: one room for everybody, survives restarts like the lobby itself (db/lobby-chat.json) */
export class LobbyChat {
  public static readonly INSTANCE = new LobbyChat();
  private messages: Array<StoredMessage> | undefined;
  private readonly recent = new Map<string, Array<number>>();

  constructor(
    private readonly clock: () => number = Date.now,
    private readonly words: () => ReadonlyArray<string> = () => ChatWordList.INSTANCE.get(),
    private readonly storage: LobbyStorage = fileStorage(lobbyChatFile()),
  ) {}

  private all(): Array<StoredMessage> {
    if (this.messages === undefined) {
      const saved = this.storage.load();
      this.messages = Array.isArray(saved) ? saved as Array<StoredMessage> : [];
    }
    this.messages = this.messages.slice(-CHAT_KEEP_MESSAGES);
    return this.messages;
  }

  /** admin: logged in on the admin page, may edit every message */
  public list(me: string | undefined, admin = false): LobbyChatModel {
    const now = this.clock();
    return {
      messages: this.all().map(({participant, ...message}) => {
        const you = participant === me;
        return {...message, you, editable: admin || (you && now - message.at < LOBBY_CHAT_EDIT_MS)};
      }),
      ...(admin ? {admin: true as const} : {}),
    };
  }

  /** Same checks for new and changed text: not empty, not too long, no links to other websites */
  private cleanText(text: unknown, serverHost: string | undefined): string {
    // Line breaks stay (Shift+Enter), but at most one empty line in a row; other white space becomes one space
    const clean = typeof text === 'string' ?
      text.replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim() :
      '';
    if (clean === '') {
      throw new LobbyError('Please enter a message');
    }
    if (Array.from(clean).length > LOBBY_CHAT_MAX_LENGTH) {
      throw new LobbyError('The message is too long');
    }
    if (hasForeignLink(clean, serverHost)) {
      throw new LobbyError('Links to other websites are not allowed in the chat');
    }
    return maskWords(clean, this.words());
  }

  /** serverHost: links to it are fine, any other link is refused */
  public post(me: string, profile: unknown, text: unknown, serverHost: string | undefined): LobbyChatModel {
    const author = sanitizeProfile(profile) as LobbyProfile;
    const clean = this.cleanText(text, serverHost);
    const now = this.clock();
    const recent = (this.recent.get(me) ?? []).filter((at) => now - at < CHAT_RATE_WINDOW_MS);
    if (recent.length >= CHAT_RATE_LIMIT) {
      throw new LobbyError('Too many messages. Please wait a moment.');
    }
    this.recent.set(me, [...recent, now]);
    const messages = this.all();
    const id = (messages[messages.length - 1]?.id ?? 0) + 1;
    messages.push({id, at: now, participant: me, name: author.name, color: author.color, emoji: author.emoji, text: clean});
    this.storage.save(this.all());
    return this.list(me);
  }

  /**
   * Changes the text of a message. The author may do so within LOBBY_CHAT_EDIT_MS and the message then shows
   * "edited"; an admin may change every message at any time without that mark (moderation, typo fixes).
   */
  public edit(me: string, id: unknown, text: unknown, serverHost: string | undefined, admin = false): LobbyChatModel {
    const message = this.all().find((candidate) => candidate.id === id);
    if (message === undefined) {
      throw new LobbyError('This message no longer exists');
    }
    if (!admin && (message.participant !== me || this.clock() - message.at >= LOBBY_CHAT_EDIT_MS)) {
      throw new LobbyError('This message can no longer be edited');
    }
    const clean = this.cleanText(text, serverHost);
    if (clean !== message.text) {
      message.text = clean;
      if (!admin) {
        message.edited = true;
      }
      this.storage.save(this.all());
    }
    return this.list(me, admin);
  }

  /** Removes a message for everybody; only an admin may (moderation) */
  public remove(me: string, id: unknown, admin: boolean): LobbyChatModel {
    if (!admin) {
      throw new LobbyError('Only an admin can delete messages');
    }
    const messages = this.all();
    const index = messages.findIndex((message) => message.id === id);
    if (index < 0) {
      throw new LobbyError('This message no longer exists');
    }
    messages.splice(index, 1);
    this.storage.save(messages);
    return this.list(me, admin);
  }
}
