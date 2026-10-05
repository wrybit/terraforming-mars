// The blink itself: the element lights up briefly twice. Brightness plus a light glow, because
// most values are white text on dark ground – brightness alone would not change them.
// drop-shadow follows the element's shape, so hexagon tiles glow as hexagons.
import {supportsWebAnimations} from '@/client/utils/motion';

const DURATION_MS = 900;
const OFF = 'brightness(1) drop-shadow(0 0 0 rgba(255, 255, 255, 0))';
const ON = 'brightness(2) drop-shadow(0 0 8px rgb(255, 255, 255))';

export function flashElement(element: HTMLElement, delayMs: number): void {
  if (!supportsWebAnimations(element)) {
    return;
  }
  element.animate([
    {filter: OFF, offset: 0},
    {filter: ON, offset: 0.2},
    {filter: OFF, offset: 0.45},
    {filter: ON, offset: 0.65},
    {filter: OFF, offset: 1},
  ], {duration: DURATION_MS, delay: delayMs, easing: 'ease-in-out'});
}
