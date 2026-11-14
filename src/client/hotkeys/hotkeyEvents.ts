// Translates a key press into the key list of hotkeyActions.ts and checks it against an action.
// Single keys are physical positions (KeyboardEvent.code), so a shortcut stays on the same key on QWERTZ, QWERTY or
// AZERTY; combinations with ⌘ / Ctrl use the character like the system does (⌘Z is undo wherever Z lies).
import {HotkeyKeys} from '@/client/hotkeys/hotkeyActions';
import {combo, keysOf} from '@/client/hotkeys/hotkeyStore';
import {codeLabel, physicalCode} from '@/client/hotkeys/hotkeyKeyLabels';

const MODIFIER_KEYS = ['Meta', 'Control', 'Shift', 'Alt', 'AltGraph', 'CapsLock'];

// The number pad counts as the main keys
const NUMPAD_CODES: Readonly<Record<string, string>> = {
  NumpadEnter: 'Enter',
  ...Object.fromEntries(Array.from({length: 10}, (_, digit) => ['Numpad' + digit, 'Digit' + digit])),
};

// Events without a code (made up by scripts and tests): position from the character
function codeFromKey(key: string): string | undefined {
  if (key === ' ') {
    return 'Space';
  }
  if (/^[0-9]$/.test(key)) {
    return 'Digit' + key;
  }
  if (/^[a-zA-Z]$/.test(key)) {
    return 'Key' + key.toUpperCase();
  }
  return key.length > 1 ? key : undefined;
}

/** Position of the pressed key as KeyboardEvent.code */
export function codeOfEvent(event: KeyboardEvent): string | undefined {
  const code = event.code !== '' && event.code !== undefined ? event.code : codeFromKey(event.key);
  return code !== undefined ? NUMPAD_CODES[code] ?? physicalCode(code) : undefined;
}

/**
 * Keys of the event, undefined for a bare modifier. Shift is ignored (characters like "?" need it on many layouts);
 * Alt combinations are never shortcuts, AltGr types characters.
 */
export function keysOfEvent(event: KeyboardEvent): HotkeyKeys | undefined {
  if (MODIFIER_KEYS.includes(event.key) || event.altKey) {
    return undefined;
  }
  if (event.metaKey || event.ctrlKey) {
    // Dead keys (´ on German keyboards) only say "Dead": the layout tells the character at the position
    const code = codeOfEvent(event);
    const key = event.key === 'Dead' && code !== undefined ? codeLabel(code) : event.key;
    return key !== undefined ? ['Mod', key.length === 1 ? key.toUpperCase() : key] : undefined;
  }
  const code = codeOfEvent(event);
  return code !== undefined ? [code] : undefined;
}

export function matchesHotkey(event: KeyboardEvent, id: string): boolean {
  const keys = keysOfEvent(event);
  const binding = keysOf(id);
  return keys !== undefined && binding.length > 0 && combo(keys) === combo(binding);
}

export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

const KEY_LABELS: Readonly<Record<string, string>> = {
  'Enter': '↵',
  'Escape': 'Esc',
  'Space': '␣',
  'ArrowLeft': '←',
  'ArrowRight': '→',
  'ArrowUp': '↑',
  'ArrowDown': '↓',
  'Backspace': '⌫',
  'Tab': '⇥',
};

/**
 * Text on the key cap: ⌘ on Mac, Ctrl elsewhere ("Strg" in German comes from the translation), the character of a
 * position on this keyboard, characters of combinations as they are
 */
export function keyCapLabel(key: string): string {
  if (key === 'Mod') {
    return isMac() ? '⌘' : 'Ctrl';
  }
  // Alt and Ctrl as their own modifier (not ⌘): the Mac symbols ⌥ and ⌃ (drawn as ^, see HotkeyKeys.vue)
  if (key === 'Alt') {
    return isMac() ? '⌥' : 'Alt';
  }
  if (key === 'Control') {
    return isMac() ? '^' : 'Ctrl';
  }
  return KEY_LABELS[key] ?? (key.length > 1 ? codeLabel(key) ?? key : key);
}
