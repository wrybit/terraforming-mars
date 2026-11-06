import {nextTick, Ref, ref} from 'vue';
import {ChatEmoji} from './lobbyChatEmoji';
import {closedShortcode, matchEmojis, openShortcode} from './emojiShortcodes';

// :name: typing for one text field (chat field, edit field): keeps the suggestions while a name is being typed,
// replaces a closed :name: at once and inserts the chosen suggestion (emojiShortcodes.ts)

export type EmojiCompletion = {
  suggestions: Ref<Array<ChatEmoji>>;
  active: Ref<number>;
  /** After every input: refreshes the suggestions, replaces a closed :name: */
  update(): void;
  choose(entry: ChatEmoji): void;
  /** Arrow keys, Enter, Tab and Esc while suggestions are open; true: the key was used here */
  onKey(event: KeyboardEvent): boolean;
  close(): void;
};

export function useEmojiCompletion(field: () => HTMLTextAreaElement | undefined, text: Ref<string>): EmojiCompletion {
  const suggestions = ref<Array<ChatEmoji>>([]);
  const active = ref(0);
  let start = -1;

  function close(): void {
    suggestions.value = [];
    active.value = 0;
    start = -1;
  }

  // Puts the emoji in place of text[from, to) and the cursor right behind it
  async function replace(from: number, to: number, emoji: string): Promise<void> {
    const element = field();
    const current = element?.value ?? text.value;
    text.value = current.slice(0, from) + emoji + current.slice(to);
    await nextTick();
    element?.focus();
    element?.setSelectionRange(from + emoji.length, from + emoji.length);
  }

  function update(): void {
    const element = field();
    if (element === undefined) {
      return;
    }
    // From the field itself: v-model may not have passed the newest letter on yet
    const cursor = element.selectionStart ?? element.value.length;
    const before = element.value.slice(0, cursor);
    const closed = closedShortcode(before);
    if (closed !== undefined) {
      close();
      void replace(closed.start, cursor, closed.emoji);
      return;
    }
    const open = openShortcode(before);
    if (open === undefined) {
      close();
      return;
    }
    start = open.start;
    suggestions.value = matchEmojis(open.query);
    active.value = 0;
  }

  function choose(entry: ChatEmoji): void {
    const element = field();
    const cursor = element?.selectionStart ?? text.value.length;
    const from = start;
    close();
    if (from >= 0) {
      void replace(from, cursor, entry.emoji);
    }
  }

  function onKey(event: KeyboardEvent): boolean {
    const count = suggestions.value.length;
    if (count === 0 || event.isComposing) {
      return false;
    }
    switch (event.key) {
    case 'ArrowDown':
      active.value = (active.value + 1) % count;
      break;
    case 'ArrowUp':
      active.value = (active.value + count - 1) % count;
      break;
    case 'Enter':
    case 'Tab':
      if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
        return false;
      }
      choose(suggestions.value[active.value]);
      break;
    case 'Escape':
      close();
      break;
    default:
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  return {suggestions, active, update, choose, onKey, close};
}
