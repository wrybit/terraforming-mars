// Which character a physical key (KeyboardEvent.code) shows on this device. Chrome and Edge tell the real keyboard
// layout (navigator.keyboard.getKeyboardLayoutMap, also AZERTY, Nordic …); other browsers fall back to the layout
// of the game language (hotkeyKeyboardLayouts.ts). Shortcuts are bound by position, so they work either way –
// only the labels on the caps and the drawn keyboard come from here.
import {shallowRef} from 'vue';
import {characterAt} from '@/client/hotkeys/hotkeyKeyboardLayouts';
import {getPreferences} from '@/client/utils/PreferencesManager';

type LayoutMap = {get(code: string): string | undefined};
type KeyboardApi = {
  getKeyboardLayoutMap?: () => Promise<LayoutMap>;
  addEventListener?: (type: 'layoutchange', listener: () => void) => void;
};

/** Real layout of the device, undefined until known or where the browser does not tell it */
export const detectedLayout = shallowRef<LayoutMap | undefined>(undefined);

function keyboardApi(): KeyboardApi | undefined {
  return typeof navigator !== 'undefined' ? (navigator as unknown as {keyboard?: KeyboardApi}).keyboard : undefined;
}

function readLayout(api: KeyboardApi): void {
  api.getKeyboardLayoutMap?.().then((map) => {
    detectedLayout.value = map;
  }).catch(() => {
    // Not allowed here (e.g. inside an iframe): keep the layout of the language
  });
}

let started = false;

/** Called once by the app; follows a switch of the layout while playing */
export function startKeyLabelDetection(): void {
  const api = keyboardApi();
  if (started || api?.getKeyboardLayoutMap === undefined) {
    return;
  }
  started = true;
  readLayout(api);
  api.addEventListener?.('layoutchange', () => readLayout(api));
}

/** Character on the key at this position, uppercase; undefined for keys without one */
export function codeLabel(code: string): string | undefined {
  const detected = detectedLayout.value?.get(code);
  if (detected !== undefined && detected !== '') {
    return detected.toUpperCase();
  }
  return characterAt(code, getPreferences().lang);
}
