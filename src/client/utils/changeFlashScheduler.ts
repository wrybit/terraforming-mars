// Several changes becoming visible at once (e.g. opening a tab) blink one after the other,
// so the eye can follow them. Long queues are capped, the last ones then blink together.
import {flashElement} from '@/client/utils/changeFlashAnimation';

const STAGGER_MS = 120;
const MAX_DELAY_MS = 1200;

let nextSlot = 0;

// All elements of one call show the same value (e.g. a space on the board and in the zoom view): same moment
export function scheduleFlash(elements: ReadonlyArray<HTMLElement>): void {
  const now = performance.now();
  const start = Math.min(Math.max(now, nextSlot), now + MAX_DELAY_MS);
  nextSlot = start + STAGGER_MS;
  for (const element of elements) {
    flashElement(element, start - now);
  }
}
