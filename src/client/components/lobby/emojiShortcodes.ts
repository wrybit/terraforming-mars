import {CHAT_EMOJI_GROUPS, ChatEmoji} from './lobbyChatEmoji';

// Emojis written as :name: while typing (chat portals do it the same way): suggestions after ":" and two letters,
// a closed :name: becomes the emoji at once. Used by useEmojiCompletion.ts for the chat field and the edit field.

const ALL_EMOJIS: ReadonlyArray<ChatEmoji> = CHAT_EMOJI_GROUPS.flatMap((group) => group.emojis);

// Second names known from other portals, and a few obvious words; they lead to an emoji of the list
const ALIASES: Readonly<Record<string, string>> = {
  '+1': 'thumbsup', '-1': 'thumbsdown', 'thumbs_up': 'thumbsup', 'thumbs_down': 'thumbsdown', 'like': 'thumbsup',
  'lol': 'joy', 'laugh': 'laughing', 'happy': 'smile', 'sad': 'cry', 'angry': 'rage', 'love': 'heart_eyes',
  'cool': 'sunglasses', 'think': 'thinking', 'sleep': 'sleeping', 'party': 'partying_face', 'fist': 'punch',
  'check': 'white_check_mark', 'cross': 'x', 'cheers': 'clinking_glasses', 'dice': 'game_die', 'money': 'moneybag',
  'planet': 'ringed_planet', 'ufo': 'flying_saucer', 'satellite': 'artificial_satellite', 'earth': 'earth_africa',
  'moon': 'crescent_moon', 'sun': 'sunny', 'tree': 'deciduous_tree', 'plant': 'seedling', 'water': 'droplet',
  'lightning': 'zap', 'energy': 'zap', 'heat': 'fire', 'city': 'cityscape', 'puzzle': 'jigsaw',
};

const BY_NAME = new Map<string, ChatEmoji>(ALL_EMOJIS.map((entry) => [entry.name, entry]));

/** Characters of a name: letters, digits, _ + - (as in :+1: or :1st_place_medal:) */
const NAME = '[a-z0-9_+-]';
const OPEN_PATTERN = new RegExp(`(^|\\s):(${NAME}{2,})$`, 'i');
const CLOSED_PATTERN = new RegExp(`(^|\\s):(${NAME}+):$`, 'i');

export function emojiByName(name: string): ChatEmoji | undefined {
  const key = name.toLowerCase();
  return BY_NAME.get(key) ?? BY_NAME.get(ALIASES[key] ?? '');
}

/** A started :name before the cursor (at least two letters, at the start or after a space): where it begins */
export function openShortcode(beforeCursor: string): {start: number, query: string} | undefined {
  const match = OPEN_PATTERN.exec(beforeCursor);
  if (match === null) {
    return undefined;
  }
  return {start: beforeCursor.length - match[2].length - 1, query: match[2].toLowerCase()};
}

/** A just closed :name: before the cursor that names an emoji: the part to replace */
export function closedShortcode(beforeCursor: string): {start: number, emoji: string} | undefined {
  const match = CLOSED_PATTERN.exec(beforeCursor);
  const entry = match === null ? undefined : emojiByName(match[2]);
  if (match === null || entry === undefined) {
    return undefined;
  }
  return {start: beforeCursor.length - match[2].length - 2, emoji: entry.emoji};
}

/**
 * Suggestions for a started name: names beginning with it first, then names with a word beginning with it
 * (":fac" finds "zany_face"), then the rest that contains it. Aliases count, each emoji appears once.
 */
export function matchEmojis(query: string, limit = 8): Array<ChatEmoji> {
  const search = query.toLowerCase();
  const candidates: Array<{entry: ChatEmoji, rank: number}> = [];
  const rankOf = (name: string): number | undefined => {
    if (name.startsWith(search)) {
      return 0;
    }
    if (name.includes('_' + search)) {
      return 1;
    }
    return name.includes(search) ? 2 : undefined;
  };
  for (const entry of ALL_EMOJIS) {
    const rank = rankOf(entry.name);
    if (rank !== undefined) {
      candidates.push({entry, rank});
    }
  }
  for (const [alias, name] of Object.entries(ALIASES)) {
    const rank = rankOf(alias);
    const target = BY_NAME.get(name);
    if (rank !== undefined && target !== undefined) {
      candidates.push({entry: {emoji: target.emoji, name: alias}, rank});
    }
  }
  candidates.sort((a, b) => a.rank - b.rank || a.entry.name.length - b.entry.name.length);
  const seen = new Set<string>();
  const result: Array<ChatEmoji> = [];
  for (const {entry} of candidates) {
    if (!seen.has(entry.emoji) && result.length < limit) {
      seen.add(entry.emoji);
      result.push(entry);
    }
  }
  return result;
}
