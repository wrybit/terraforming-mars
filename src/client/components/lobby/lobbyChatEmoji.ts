// Emojis of the chat's emoji popover (LobbyChat.vue) in groups, and the check for messages that are only emojis

/** One heading of the popover with its emojis; the title is an English text key (translated in the popover) */
export type ChatEmojiGroup = {title: string, emojis: ReadonlyArray<string>};

// Rows of seven in the popover: every group fills whole rows
export const CHAT_EMOJI_GROUPS: ReadonlyArray<ChatEmojiGroup> = [
  {title: 'Faces', emojis: [
    '😀', '😃', '😄', '😁', '😆', '😂', '🤣', '😅', '😊', '😇', '🙂', '😉', '😍', '🥰',
    '😘', '😋', '😜', '🤪', '😎', '🤓', '🤗', '🤔', '🤨', '😐', '😶', '🙄', '😏', '😬',
    '😮', '😲', '😳', '🥺', '😢', '😭', '😤', '😡', '🤬', '🤯', '😱', '😴', '🥱', '🤐',
  ]},
  {title: 'Gestures', emojis: [
    '👍', '👎', '👏', '🙌', '🙏', '💪', '👋', '🤝', '👌', '✌️', '🤞', '🤟', '🤘', '👊',
    '✊', '🫡', '👉', '👈', '👆', '👇', '🫶',
  ]},
  {title: 'Celebration', emojis: [
    '🎉', '🎊', '🥳', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '👑', '💯', '✨',
  ]},
  {title: 'Space', emojis: [
    '🚀', '🛸', '🛰️', '🪐', '🌍', '🌎', '🌏', '🌑', '🌕', '🌙', '☀️', '⭐', '🌟', '💫',
    '☄️', '🌌', '🔭', '👽', '👾', '🧑‍🚀', '🌋',
  ]},
  {title: 'Nature', emojis: [
    '🌱', '🌿', '🍀', '🌳', '🌲', '🌴', '🌵', '🌾', '🌻', '🌸', '🍄', '🦠', '🐛', '🐝',
    '🐟', '🐸', '🐾', '💧', '🌊', '🔥', '❄️', '🌡️', '⚡', '🌪️', '🌈', '☁️', '🌧️', '🏔️',
  ]},
  {title: 'Food & drink', emojis: [
    '☕', '🍵', '🍺', '🍻', '🍷', '🥂', '🍾', '🍕', '🍔', '🍟', '🌮', '🍿', '🍩', '🍪',
    '🍫', '🍰', '🍎', '🍌', '🥕', '🥔', '🧀',
  ]},
  {title: 'Objects', emojis: [
    '🎲', '♟️', '🃏', '🧩', '🎮', '⏳', '⌛', '⏰', '💰', '💎', '🔧', '🔨', '⚙️', '🧪',
    '🏭', '🏙️', '🏗️', '🏛️', '⚓', '📈', '📉',
  ]},
  {title: 'Symbols', emojis: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '✅', '❌', '❓', '❗',
    '⚠️', '🚫', '💤', '💬', '👀', '🆗', '🔝',
  ]},
];

const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;

/** Characters as people see them (an emoji with skin tone or a family is one); without Segmenter: code points */
function graphemes(text: string): Array<string> {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

/** A message of only 1 to 3 emojis (spaces aside) is shown large, like a reaction */
export function isEmojiOnly(text: string): boolean {
  const characters = graphemes(text.replace(/\s+/g, ''));
  return characters.length >= 1 && characters.length <= 3 && characters.every((character) => PICTOGRAPHIC.test(character));
}
