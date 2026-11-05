import * as path from 'path';
import {fileStorage, LobbyStorage} from './lobbyStorage';

// Words the lobby chat masks with asterisks. The admin page edits the list (routes/ApiAdminChatWords.ts);
// until it is saved there, the default set below applies. An entry matches at the start of a word in any
// case, so "arsch" also catches "Arschloch", but not "Barsch". Entries that start ordinary words are left out
// of the default set (e.g. "dick", German for thick).

export const DEFAULT_CHAT_WORDS: ReadonlyArray<string> = [
  // German
  'arsch', 'arschgeige', 'arschloch', 'bastard', 'bitch', 'depp', 'drecksau', 'dreckskerl', 'fick', 'fotze', 'hackfresse',
  'hurensohn', 'hure', 'idiot', 'missgeburt', 'nazi', 'neger', 'nutte', 'penner', 'pisser', 'scheiß',
  'scheiss', 'scheisse', 'schlampe', 'schwanzlutscher', 'schwuchtel', 'spast', 'spasti', 'trottel', 'vollidiot', 'wichser',
  // English
  'asshole', 'bullshit', 'cocksucker', 'cunt', 'dickhead', 'dumbass', 'fag', 'faggot', 'fuck', 'motherfucker', 'nigga', 'nigger',
  'piss', 'pussy', 'retard', 'shit', 'slut', 'twat', 'whore', 'wanker',
];

export function chatWordsFile(): string {
  return process.env.CHAT_WORDS_FILE ?? path.resolve('db', 'chat-words.json');
}

function escapeForRegExp(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Masks every word that starts with an entry of the list; letters of any script count as word characters */
export function maskWords(text: string, words: ReadonlyArray<string>): string {
  const entries = words.map((word) => word.trim()).filter((word) => word !== '');
  if (entries.length === 0) {
    return text;
  }
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${entries.map(escapeForRegExp).join('|')})[\\p{L}\\p{N}]*`, 'giu');
  return text.replace(pattern, (match) => '*'.repeat(Array.from(match).length));
}

/** Trimmed, lower case, without duplicates and empty lines, sorted */
export function normalizeChatWords(words: ReadonlyArray<unknown>): Array<string> {
  const clean = words.filter((word): word is string => typeof word === 'string').map((word) => word.trim().toLowerCase()).filter((word) => word !== '' && word.length <= 40);
  return Array.from(new Set(clean)).sort((a, b) => a.localeCompare(b));
}

export class ChatWordList {
  public static readonly INSTANCE = new ChatWordList();
  private words: Array<string> | undefined;

  constructor(private readonly storage: LobbyStorage = fileStorage(chatWordsFile())) {}

  public get(): Array<string> {
    if (this.words === undefined) {
      const saved = this.storage.load();
      this.words = Array.isArray(saved) ? normalizeChatWords(saved) : normalizeChatWords([...DEFAULT_CHAT_WORDS]);
    }
    return this.words;
  }

  public set(words: ReadonlyArray<unknown>): Array<string> {
    this.words = normalizeChatWords(words);
    this.storage.save(this.words);
    return this.words;
  }
}
