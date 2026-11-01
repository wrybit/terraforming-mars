// Which character a physical key (KeyboardEvent.code) shows on this device. Chrome and Edge tell the real keyboard
// layout (navigator.keyboard.getLayoutMap, also AZERTY, Nordic …); other browsers learn it from the keys the
// player actually presses, then fall back to the layout of the game language (hotkeyKeyboardLayouts.ts). Letters are
// bound by physical position, so only the labels on the caps and the drawn keyboard come from here.
import {shallowRef} from 'vue';
import {characterAt} from '@/client/hotkeys/hotkeyKeyboardLayouts';
import {getPreferences} from '@/client/utils/PreferencesManager';

type LayoutMap = {get(code: string): string | undefined};
type KeyboardApi = {
  getLayoutMap?: () => Promise<LayoutMap>;
  addEventListener?: (type: 'layoutchange', listener: () => void) => void;
};

/** Real layout of the device, undefined until known or where the browser does not tell it */
export const detectedLayout = shallowRef<LayoutMap | undefined>(undefined);

// Fallback for browsers without navigator.keyboard (Firefox, Safari …): labels learned from actual key presses.
const observedLayout = shallowRef<ReadonlyMap<string, string>>(new Map());

function rememberKey(code: string, character: string): void {
  if (observedLayout.value.get(code) === character) {
    return;
  }
  const next = new Map(observedLayout.value);
  next.set(code, character);
  observedLayout.value = next;
}

/** Learns the character on a physical key from an actual press; useful where the browser has no layout API. */
export function observeKeyLayout(event: KeyboardEvent): void {
  if (event.code === '' || event.code === undefined || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  if (event.key.length !== 1 || event.key === ' ') {
    return;
  }
  // Shift gives the upper symbol, not the character printed on the key cap. Letters are the same in both cases.
  if (event.shiftKey && !/^[a-zA-Z]$/.test(event.key)) {
    return;
  }
  const character = /^[a-zA-Z]$/.test(event.key) ? event.key.toUpperCase() : event.key;
  rememberKey(event.code, character);
  const normalized = physicalCode(event.code);
  if (normalized !== event.code) {
    rememberKey(normalized, character);
  }
}

const QWERTZ_LANGUAGES = ['de', 'hu'];
let isoKeySeen = false;

function mac(): boolean {
  return typeof navigator !== 'undefined' && /Mac/.test(navigator.platform || navigator.userAgent);
}

// Mac keyboards with the ISO layout (German, most of Europe) report the key left of 1 as IntlBackslash and the
// <> key next to the left Shift as Backquote – swapped against every other system (known browser behaviour on macOS).
// The IntlBackslash key only exists on ISO keyboards, so one press of it, the reported layout or a QWERTZ language
// tells that the swap applies.
function isoMac(): boolean {
  if (!mac()) {
    return false;
  }
  return isoKeySeen || (detectedLayout.value?.get('IntlBackslash') ?? '') !== '' || QWERTZ_LANGUAGES.includes(getPreferences().lang);
}

/** The position as on every other system: swaps the two keys on Mac ISO keyboards */
export function physicalCode(code: string): string {
  if (code === 'IntlBackslash' && mac()) {
    isoKeySeen = true;
    return 'Backquote';
  }
  if (code === 'Backquote' && isoMac()) {
    return 'IntlBackslash';
  }
  return code;
}

function keyboardApi(): KeyboardApi | undefined {
  return typeof navigator !== 'undefined' ? (navigator as unknown as {keyboard?: KeyboardApi}).keyboard : undefined;
}

function readLayout(api: KeyboardApi): void {
  api.getLayoutMap?.().then((map) => {
    detectedLayout.value = map;
  }).catch(() => {
    // Not allowed here (e.g. inside an iframe): keep the observed keys and the layout of the language
  });
}

let started = false;
let apiStarted = false;

/** Called once by the app; follows a switch of the layout while playing. */
export function startKeyLabelDetection(): void {
  if (!started && typeof window !== 'undefined') {
    started = true;
    window.addEventListener('keydown', observeKeyLayout, true);
  }
  const api = keyboardApi();
  if (apiStarted || api?.getLayoutMap === undefined) {
    return;
  }
  apiStarted = true;
  readLayout(api);
  api.addEventListener?.('layoutchange', () => readLayout(api));
}

/** Character on the key at this position, uppercase; undefined for keys without one */
export function codeLabel(code: string): string | undefined {
  // The reported layout uses the browser's (swapped) codes on Mac ISO keyboards
  const swapped = code === 'Backquote' ? 'IntlBackslash' : 'Backquote';
  const reported = isoMac() && (code === 'Backquote' || code === 'IntlBackslash') ? swapped : code;
  const detected = detectedLayout.value?.get(reported);
  if (detected !== undefined && detected !== '') {
    return detected.toUpperCase();
  }
  const observed = observedLayout.value.get(reported) ?? observedLayout.value.get(code);
  if (observed !== undefined) {
    return observed;
  }
  return characterAt(code, getPreferences().lang);
}
