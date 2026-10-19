// Own key bindings and the "show keys in the game" switch. Both only live on this device (localStorage), so the
// help dialog can export and import the bindings as JSON to move them to another device. Only keys that differ from
// the default are stored, so later changes of the defaults reach every player.
import {reactive} from 'vue';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';
import {FIXED_HOTKEYS, HOTKEY_ACTIONS, HotkeyAction, HotkeyKeys, canMeet, findHotkeyAction} from '@/client/hotkeys/hotkeyActions';

const STORAGE_KEY = 'hotkeys';
// Version 3: single keys are positions (KeyboardEvent.code); bindings of older versions (characters) are dropped
const EXPORT_VERSION = 3;

type StoredHotkeys = {
  version: number;
  hotkeys: Record<string, HotkeyKeys>;
  showHints?: boolean;
};

export const hotkeyState = reactive({
  /** Own keys of the player, by action id; actions without an entry use their default */
  bindings: {} as Record<string, HotkeyKeys>,
  showHints: true,
});

function isKeyList(value: unknown): value is Array<string> {
  return Array.isArray(value) && value.every((key) => typeof key === 'string');
}

export function combo(keys: HotkeyKeys): string {
  return keys.join('+');
}

function defaultOf(id: string): HotkeyKeys {
  const action = findHotkeyAction(id);
  return action?.keys ?? [];
}

function storeBinding(id: string, keys: HotkeyKeys): void {
  if (combo(keys) === combo(defaultOf(id))) {
    delete hotkeyState.bindings[id];
  } else {
    hotkeyState.bindings[id] = keys;
  }
}

// Only known, editable actions are taken over; unknown ids (older or newer versions) are ignored
function applyBindings(source: Record<string, unknown>): number {
  let count = 0;
  for (const [id, keys] of Object.entries(source)) {
    const action = findHotkeyAction(id);
    if (action !== undefined && action.locked !== true && isKeyList(keys)) {
      storeBinding(id, keys);
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
    if (stored.version === EXPORT_VERSION && stored.hotkeys !== undefined && typeof stored.hotkeys === 'object') {
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
  if (action === undefined) {
    return [];
  }
  if (action.locked === true) {
    return action.keys;
  }
  return hotkeyState.bindings[id] ?? action.keys;
}

export function setBinding(id: string, keys: HotkeyKeys): void {
  storeBinding(id, keys);
  saveHotkeys();
}

export function resetBindings(): void {
  hotkeyState.bindings = {};
  saveHotkeys();
}

export function setShowHints(show: boolean): void {
  hotkeyState.showHints = show;
  saveHotkeys();
}

/**
 * Ids of editable actions that share their keys with another action; empty bindings never collide, nor do two
 * shortcuts that never meet in one game (canMeet: Dune reuses the keys of the other expansions)
 */
export function duplicateBindings(): Set<string> {
  const seen = new Map<string, Array<HotkeyAction>>();
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
    const others = seen.get(key) ?? [];
    for (const other of others.filter((candidate) => canMeet(candidate, action))) {
      duplicates.add(other.id);
      duplicates.add(action.id);
    }
    seen.set(key, [...others, action]);
  }
  return duplicates;
}

/** All editable shortcuts with their current keys, so an import on another device gives exactly these keys */
export function exportHotkeys(): string {
  const hotkeys: Record<string, HotkeyKeys> = {};
  for (const action of HOTKEY_ACTIONS) {
    if (action.locked !== true) {
      hotkeys[action.id] = keysOf(action.id);
    }
  }
  return JSON.stringify({version: EXPORT_VERSION, hotkeys}, null, 2);
}

/** Takes over the bindings of an export; returns how many were read, throws on text that is no export */
export function importHotkeys(text: string): number {
  const data = JSON.parse(text) as Partial<StoredHotkeys>;
  if (data.version !== EXPORT_VERSION || data.hotkeys === undefined || typeof data.hotkeys !== 'object' || data.hotkeys === null) {
    throw new Error('No hotkeys in this file');
  }
  const count = applyBindings(data.hotkeys);
  saveHotkeys();
  return count;
}

/** Action whose editable or fixed binding matches the keys, undefined if none */
export function actionForKeys(keys: HotkeyKeys): string | undefined {
  return actionsForKeys(keys)[0];
}

/**
 * Every action on these keys, in list order: Dune shares keys with the other expansions (canMeet), so the
 * dispatcher tries them in turn and the one whose tab exists in this game takes the key
 */
export function actionsForKeys(keys: HotkeyKeys): Array<string> {
  const wanted = combo(keys);
  const editable = HOTKEY_ACTIONS.filter((action) => action.locked !== true && combo(keysOf(action.id)) === wanted).map((action) => action.id);
  if (editable.length > 0) {
    return editable;
  }
  return Object.keys(FIXED_HOTKEYS).filter((id) => combo(FIXED_HOTKEYS[id]) === wanted);
}
