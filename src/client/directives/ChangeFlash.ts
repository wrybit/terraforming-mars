// v-flash="key" on an element showing a value (keys: changeFlashKeys.ts): it blinks twice
// once another player changed that value and the element is visible (changeFlashRegistry.ts).
// undefined as value: the element does not take part (e.g. only the current step of a scale).
import {Directive} from 'vue';
import {flashKeyOf, registerFlashElement, unregisterFlashElement} from '@/client/utils/changeFlashRegistry';

export const vFlash: Directive<HTMLElement, string | undefined> = {
  mounted(element, binding) {
    if (binding.value !== undefined) {
      registerFlashElement(element, binding.value);
    }
  },
  updated(element, binding) {
    if (flashKeyOf(element) === binding.value) {
      return;
    }
    unregisterFlashElement(element);
    if (binding.value !== undefined) {
      registerFlashElement(element, binding.value);
    }
  },
  beforeUnmount(element) {
    unregisterFlashElement(element);
  },
};
