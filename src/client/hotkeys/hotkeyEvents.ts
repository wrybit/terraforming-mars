// Translates a key press into the key list of hotkeyActions.ts and checks it against an action.
import {HotkeyKeys} from '@/client/hotkeys/hotkeyActions';
import {combo, keysOf} from '@/client/hotkeys/hotkeyStore';

const MODIFIER_KEYS = ['Meta', 'Control', 'Shift', 'Alt', 'AltGraph', 'CapsLock'];

/**
 * Keys of the event, undefined for a bare modifier. Shift is ignored (characters like "/" or "?" need it on many
 * layouts); Alt combinations are never shortcuts, AltGr types characters.
 */
export function keysOfEvent(event: KeyboardEvent): HotkeyKeys | undefined {
  if (MODIFIER_KEYS.includes(event.key) || event.altKey) {
    return undefined;
  }
  const keys: Array<string> = [];
  if (event.metaKey || event.ctrlKey) {
    keys.push('Mod');
  }
  keys.push(event.key.length === 1 ? event.key.toUpperCase() : event.key);
  return keys;
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
  'ArrowLeft': '←',
  'ArrowRight': '→',
  'ArrowUp': '↑',
  'ArrowDown': '↓',
  'Backspace': '⌫',
  ' ': '␣',
};

/** Text on the key cap: ⌘ on Mac, Ctrl elsewhere ("Strg" in German comes from the translation) */
export function keyCapLabel(key: string): string {
  if (key === 'Mod') {
    return isMac() ? '⌘' : 'Ctrl';
  }
  return KEY_LABELS[key] ?? key;
}
