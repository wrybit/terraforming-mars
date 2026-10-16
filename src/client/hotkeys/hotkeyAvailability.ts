// Shortcuts only exist where a keyboard is the main input: not in the mobile view and not on touch devices.
// While they are available and the player wants to see them, the class HOTKEY_ROOT_CLASS on <html> shows the key
// caps at buttons, tabs and cards (hotkeys.less).
import {computed, ref, watchEffect} from 'vue';
import {mobileLayout} from '@/client/utils/mobileLayout';
import {hotkeyState} from '@/client/hotkeys/hotkeyStore';

export const HOTKEY_ROOT_CLASS = 'tm-hotkeys';

const TOUCH_QUERY = '(pointer: coarse)';
const touchDevice = ref(false);

export const hotkeysAvailable = computed(() => !mobileLayout.value && !touchDevice.value);

let started = false;

export function startHotkeyAvailability(): void {
  if (started || typeof window === 'undefined') {
    return;
  }
  started = true;
  const query = window.matchMedia?.(TOUCH_QUERY);
  touchDevice.value = query?.matches ?? false;
  query?.addEventListener?.('change', () => {
    touchDevice.value = query.matches;
  });
  watchEffect(() => {
    document.documentElement.classList.toggle(HOTKEY_ROOT_CLASS, hotkeysAvailable.value && hotkeyState.showHints);
  });
}
