// Current key bindings and the "show keys in the game" switch. Both only live on this device (localStorage), so the
// help dialog can export and import the bindings as JSON to move them to another device.
import {reactive} from 'vue';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';
import {FIXED_HOTKEYS, HOTKEY_ACTIONS, HotkeyKeys, defaultBindings, findHotkeyAction} from '@/client/hotkeys/hotkeyActions';

const STORAGE_KEY = 'hotkeys';
const EXPORT_VERSION = 1;

type StoredHotkeys = {
  version: number;
  hotkeys: Record<string, HotkeyKeys>;
  showHints?: boolean;
};

export const hotkeyState = reactive({
  bindings: defaultBindings(),
  showHints: true,
});

function isKeyList(value: unknown): value is Array<string> {
  return Array.isArray(value) && value.every((key) => typeof key === 'string');
}

// Only known, editable actions are taken over; unknown ids (older or newer versions) are ignored
function applyBindings(source: Record<string, unknown>): number {
  let count = 0;
  for (const [id, keys] of Object.entries(source)) {
    const action = findHotkeyAction(id);
    if (action !== undefined && action.locked !== true && isKeyList(keys)) {
      hotkeyState.bindings[id] = keys;
      count++;
    }
  }
  return count;
}

export function loadHotkeys(): void {
  const raw = safeLocalStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return;
  }
  try {
    const stored = JSON.parse(raw) as Partial<StoredHotkeys>;
    if (stored.hotkeys !== undefined && typeof stored.hotkeys === 'object') {
      applyBindings(stored.hotkeys);
    }
    if (typeof stored.showHints === 'boolean') {
      hotkeyState.showHints = stored.showHints;
    }
  } catch {
    // Broken entry: keep the defaults
  }
}

export function saveHotkeys(): void {
  const stored: StoredHotkeys = {version: EXPORT_VERSION, hotkeys: hotkeyState.bindings, showHints: hotkeyState.showHints};
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function keysOf(id: string): HotkeyKeys {
  const fixed = FIXED_HOTKEYS[id];
  if (fixed !== undefined) {
    return fixed;
  }
  const action = findHotkeyAction(id);
  if (action?.locked === true) {
    return action.keys;
  }
  return hotkeyState.bindings[id] ?? action?.keys ?? [];
}

export function setBinding(id: string, keys: HotkeyKeys): void {
  hotkeyState.bindings[id] = keys;
  saveHotkeys();
}

export function resetBindings(): void {
  hotkeyState.bindings = defaultBindings();
  saveHotkeys();
}

export function setShowHints(show: boolean): void {
  hotkeyState.showHints = show;
  saveHotkeys();
}

export function combo(keys: HotkeyKeys): string {
  return keys.join('+');
}

/** Ids of editable actions that share their keys with another action; empty bindings never collide */
export function duplicateBindings(): Set<string> {
  const seen = new Map<string, string>();
  const duplicates = new Set<string>();
  for (const action of HOTKEY_ACTIONS) {
    if (action.locked === true) {
      continue;
    }
    const keys = keysOf(action.id);
    if (keys.length === 0) {
      continue;
    }
    const key = combo(keys);
    const other = seen.get(key);
    if (other === undefined) {
      seen.set(key, action.id);
    } else {
      duplicates.add(other);
      duplicates.add(action.id);
    }
  }
  return duplicates;
}

export function exportHotkeys(): string {
  return JSON.stringify({version: EXPORT_VERSION, hotkeys: hotkeyState.bindings}, null, 2);
}

/** Takes over the bindings of an export; returns how many were read, throws on text that is no export */
export function importHotkeys(text: string): number {
  const data = JSON.parse(text) as Partial<StoredHotkeys>;
  if (data.hotkeys === undefined || typeof data.hotkeys !== 'object' || data.hotkeys === null) {
    throw new Error('No hotkeys in this file');
  }
  const count = applyBindings(data.hotkeys);
  saveHotkeys();
  return count;
}

/** Action whose editable or fixed binding matches the keys, undefined if none */
export function actionForKeys(keys: HotkeyKeys): string | undefined {
  const wanted = combo(keys);
  const editable = HOTKEY_ACTIONS.find((action) => action.locked !== true && combo(keysOf(action.id)) === wanted);
  if (editable !== undefined) {
    return editable.id;
  }
  return Object.keys(FIXED_HOTKEYS).find((id) => combo(FIXED_HOTKEYS[id]) === wanted);
}
