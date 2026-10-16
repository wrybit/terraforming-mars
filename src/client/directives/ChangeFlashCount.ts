// v-flash-count="key" on a resource number: instead of blinking, it counts from the old to the
// new value once another player changed it and it is visible (changeFlashCount.ts).
// Modifier .signed for production ("+2").
import {Directive} from 'vue';
import {registerFlashElement, revealVisibleChanges, unregisterFlashElement} from '@/client/utils/changeFlashRegistry';
import {isChangePending, previousValueOf} from '@/client/utils/changeTracker';
import {isHoldingValue, releaseHeldValue, showPreviousValue} from '@/client/utils/changeFlashCount';

export const vFlashCount: Directive<HTMLElement, string> = {
  mounted(element, binding) {
    if (isChangePending(binding.value)) {
      showPreviousValue(element, parseFloat(previousValueOf(binding.value) ?? ''), binding.modifiers.signed === true);
    }
    registerFlashElement(element, [binding.value], binding.modifiers.signed ? 'countSigned' : 'count');
  },
  updated(element, binding) {
    // Change dropped meanwhile (generation change, seen in another tab): no count follows, show the current value
    if (!isChangePending(binding.value)) {
      releaseHeldValue(element);
    }
    if (binding.value !== binding.oldValue) {
      unregisterFlashElement(element);
      registerFlashElement(element, [binding.value], binding.modifiers.signed ? 'countSigned' : 'count');
      return;
    }
    // New change of a number that stays on screen (no remount, so no intersection event): hold the old
    // value and count now – otherwise the change waits unseen and a count still running would keep its end value
    if (isChangePending(binding.value) && !isHoldingValue(element)) {
      showPreviousValue(element, parseFloat(previousValueOf(binding.value) ?? ''), binding.modifiers.signed === true);
      revealVisibleChanges();
    }
  },
  beforeUnmount(element) {
    unregisterFlashElement(element);
  },
};
