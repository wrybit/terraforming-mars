// v-flash="key" (or a list of keys) on an element showing a value (keys: changeFlashKeys.ts): it blinks
// once another player changed that value and the element is visible (changeFlashRegistry.ts).
// undefined as value: the element does not take part (e.g. only the current step of a scale).
import {Directive} from 'vue';
import {flashKeysOf, registerFlashElement, unregisterFlashElement} from '@/client/utils/changeFlashRegistry';

type FlashValue = string | ReadonlyArray<string> | undefined;

function keysOf(value: FlashValue): ReadonlyArray<string> {
  if (value === undefined) {
    return [];
  }
  return typeof value === 'string' ? [value] : value;
}

export const vFlash: Directive<HTMLElement, FlashValue> = {
  mounted(element, binding) {
    registerFlashElement(element, keysOf(binding.value));
  },
  updated(element, binding) {
    const keys = keysOf(binding.value);
    const current = flashKeysOf(element);
    if (keys.length === current.length && keys.every((key, index) => key === current[index])) {
      return;
    }
    unregisterFlashElement(element);
    registerFlashElement(element, keys);
  },
  beforeUnmount(element) {
    unregisterFlashElement(element);
  },
};
