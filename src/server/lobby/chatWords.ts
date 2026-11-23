import * as path from 'path';
import {fileStorage, LobbyStorage} from './lobbyStorage';
import {ALL_LANGUAGES, LANGUAGE} from '../../common/constants';
import {ChatWordLists} from '../../common/lobby/LobbyChatModel';
import {DEFAULT_CHAT_WORDS} from './chatWordDefaults';

// Words the lobby chat masks with asterisks, one list per app language (defaults: chatWordDefaults.ts). The admin
// page edits the lists (routes/ApiAdminChatWords.ts); until they are saved there, the defaults apply. Every list
// applies to every message. An entry matches at the start of a word in any case, so "arsch" also catches
// "Arschloch", but not "Barsch"; Chinese and Japanese entries match anywhere (no spaces between words there).

export function chatWordsFile(): string {
  return process.env.CHAT_WORDS_FILE ?? path.resolve('db', 'chat-words.json');
}

function escapeForRegExp(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Scripts written without spaces between words: an entry there cannot wait for a word start
const WITHOUT_SPACES = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/**
 * Masks every word that starts with an entry of the list; letters of any script count as word characters.
 * Entries in Chinese or Japanese script are masked wherever they appear.
 */
export function maskWords(text: string, words: ReadonlyArray<string>): string {
  const entries = words.map((word) => word.trim()).filter((word) => word !== '');
  const spaced = entries.filter((word) => !WITHOUT_SPACES.test(word));
  const unspaced = entries.filter((word) => WITHOUT_SPACES.test(word));
  const parts: Array<string> = [];
  if (spaced.length > 0) {
    parts.push(`(?<![\\p{L}\\p{N}])(?:${spaced.map(escapeForRegExp).join('|')})[\\p{L}\\p{N}]*`);
  }
  if (unspaced.length > 0) {
    parts.push(`(?:${unspaced.map(escapeForRegExp).join('|')})`);
  }
  if (parts.length === 0) {
    return text;
  }
  return text.replace(new RegExp(parts.join('|'), 'giu'), (match) => '*'.repeat(Array.from(match).length));
}

/** Trimmed, lower case, without duplicates and empty lines, sorted */
export function normalizeChatWords(words: ReadonlyArray<unknown>): Array<string> {
  const clean = words.filter((word): word is string => typeof word === 'string').map((word) => word.trim().toLowerCase()).filter((word) => word !== '' && word.length <= 40);
  return Array.from(new Set(clean)).sort((a, b) => a.localeCompare(b));
}

/** One normalized list per app language; unknown languages are dropped, missing ones are empty. */
export function normalizeChatWordLists(lists: unknown): ChatWordLists {
  const source = (typeof lists === 'object' && lists !== null && !Array.isArray(lists)) ? lists as Record<string, unknown> : {};
  return Object.fromEntries(ALL_LANGUAGES.map((language) => {
    const words = source[language];
    return [language, Array.isArray(words) ? normalizeChatWords(words) : []];
  })) as ChatWordLists;
}

export function defaultChatWordLists(): ChatWordLists {
  return normalizeChatWordLists(DEFAULT_CHAT_WORDS);
}

/**
 * The saved lists. Before the lists per language the file held one list: its words keep the language of the
 * default list they appear in, own additions go to German (the admin's language then), and the new default
 * words of every language join them.
 */
function loadChatWordLists(saved: unknown): ChatWordLists {
  if (!Array.isArray(saved)) {
    return saved === undefined ? defaultChatWordLists() : normalizeChatWordLists(saved);
  }
  const lists: Record<LANGUAGE, Array<string>> = {...defaultChatWordLists()};
  const known = new Set(Object.values(lists).flat());
  const additions = normalizeChatWords(saved).filter((word) => !known.has(word));
  lists.de = normalizeChatWords([...lists.de, ...additions]);
  return lists;
}

export class ChatWordList {
  public static readonly INSTANCE = new ChatWordList();
  private lists: ChatWordLists | undefined;

  constructor(private readonly storage: LobbyStorage = fileStorage(chatWordsFile())) {}

  public get(): ChatWordLists {
    if (this.lists === undefined) {
      this.lists = loadChatWordLists(this.storage.load());
    }
    return this.lists;
  }

  /** Words of all languages: every list applies to every message */
  public allWords(): Array<string> {
    return Array.from(new Set(Object.values(this.get()).flat()));
  }

  public set(lists: unknown): ChatWordLists {
    this.lists = normalizeChatWordLists(lists);
    this.storage.save(this.lists);
    return this.lists;
  }
}
