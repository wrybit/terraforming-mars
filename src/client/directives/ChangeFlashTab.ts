// v-flash-tab on a tab: blinks twice when another player changed something inside it
// while it is not active. The changed elements themselves blink once the tab is opened (ChangeFlash.ts).
import {Directive} from 'vue';
import {FlashArea} from '@/client/utils/changeFlashKeys';
import {markChangeAnnounced, markChangeSeen, unannouncedChanges} from '@/client/utils/changeTracker';
import {hasFlashElement, isFlashElementVisible} from '@/client/utils/changeFlashRegistry';
import {scheduleEffect} from '@/client/utils/changeFlashScheduler';
import {flashElement} from '@/client/utils/changeFlashAnimation';

export type FlashTabBinding = {
  // Unique per tab: a change can sit behind several tabs, each blinks once for it
  id: string;
  areas: ReadonlyArray<FlashArea>;
  active: boolean;
};

// The view is rebuilt after every update: give the changed elements time to register
// and report their visibility before deciding whether they are hidden
const CHECK_DELAY_MS = 300;

const bindings = new WeakMap<HTMLElement, FlashTabBinding>();
const timers = new WeakMap<HTMLElement, number>();

function announceHiddenChanges(tab: HTMLElement): void {
  const binding = bindings.get(tab);
  if (binding === undefined || binding.active || !tab.isConnected) {
    return;
  }
  // Browser tab in the background: the viewer should see the blink
  if (document.hidden) {
    document.addEventListener('visibilitychange', () => announceHiddenChanges(tab), {once: true});
    return;
  }
  let hidden = false;
  for (const key of unannouncedChanges(binding.id, binding.areas)) {
    if (!hasFlashElement(key)) {
      // Not shown anywhere in this view: nothing to point at
      markChangeSeen(key);
    } else if (!isFlashElementVisible(key)) {
      markChangeAnnounced(key, binding.id);
      hidden = true;
    }
  }
  if (hidden) {
    scheduleEffect((delayMs) => flashElement(tab, delayMs));
  }
}

export const vFlashTab: Directive<HTMLElement, FlashTabBinding> = {
  mounted(tab, binding) {
    bindings.set(tab, binding.value);
    timers.set(tab, window.setTimeout(() => announceHiddenChanges(tab), CHECK_DELAY_MS));
  },
  updated(tab, binding) {
    bindings.set(tab, binding.value);
  },
  beforeUnmount(tab) {
    window.clearTimeout(timers.get(tab));
    bindings.delete(tab);
  },
};
