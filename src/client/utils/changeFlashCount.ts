// Numbers (resources, TR, points, counters) don't blink: the number counts from the old to the new value, so the
// viewer sees how much was spent or gained. The number glows while counting.
import {supportsWebAnimations} from '@/client/utils/motion';
import {FlashTone, toneColor} from '@/client/utils/changeFlashTone';

const DURATION_MS = 2000;

// The text node Vue renders the number into. Its value is changed in place, so Vue's
// reference to the node stays valid; at the end it holds exactly what Vue rendered.
function numberTextNode(element: HTMLElement): Text | undefined {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let found: Text | undefined;
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if (/\d/.test(node.nodeValue ?? '')) {
      found = node as Text;
    }
  }
  return found;
}

// Fast at first, slow towards the target: the last steps stay readable
function easeOut(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

// The box around the number (data-flash-frame, change_flash.less) turns darker while counting
const COUNTING_CLASS = 'change-flash-counting';
function darkenFrame(element: HTMLElement, delayMs: number): void {
  const frame = element.closest<HTMLElement>('[data-flash-frame]');
  if (frame === null) {
    return;
  }
  window.setTimeout(() => frame.classList.add(COUNTING_CLASS), delayMs);
  window.setTimeout(() => frame.classList.remove(COUNTING_CLASS), delayMs + DURATION_MS);
}

// signed: production is shown as "+2" (positive values with a plus sign)
function formatted(value: number, signed: boolean): string {
  return signed && value > 0 ? `+${value}` : `${value}`;
}

// Right after rendering, before the first paint: the number still shows the old value, otherwise
// the new one would flash up before counting starts. Remembers the rendered text for the end.
const renderedText = new WeakMap<Text, string>();
export function showPreviousValue(element: HTMLElement, from: number, signed: boolean): void {
  const textNode = numberTextNode(element);
  if (textNode === undefined || Number.isNaN(from)) {
    return;
  }
  renderedText.set(textNode, textNode.nodeValue ?? '');
  textNode.nodeValue = formatted(from, signed);
}

// false: nothing to count (e.g. "·" for zero), the caller blinks instead
export function countElement(element: HTMLElement, from: number, signed: boolean, delayMs: number, tone: FlashTone): boolean {
  const textNode = numberTextNode(element);
  const finalText = (textNode !== undefined ? renderedText.get(textNode) : undefined) ?? textNode?.nodeValue ?? '';
  const to = parseInt(finalText.replace('+', ''), 10);
  if (textNode === undefined || Number.isNaN(from) || Number.isNaN(to) || from === to) {
    if (textNode !== undefined) {
      textNode.nodeValue = finalText;
    }
    return false;
  }
  const format = (value: number) => formatted(value, signed);
  textNode.nodeValue = format(from);

  if (supportsWebAnimations(element)) {
    // Taken away by another player: glows orange-red like every attack
    const GLOW = `brightness(${tone === 'loss' ? 1.3 : 1.6}) drop-shadow(0 0 8px ${toneColor(tone)})`;
    const NO_GLOW = `brightness(1) drop-shadow(0 0 0 ${toneColor(tone, 0)})`;
    element.animate([{filter: GLOW}, {filter: GLOW, offset: 0.8}, {filter: NO_GLOW}], {duration: DURATION_MS, delay: delayMs, fill: 'backwards'});
    if (tone === 'loss') {
      // The digits themselves turn orange-red while counting down, a glow alone is too subtle on white text
      const color = toneColor(tone);
      element.animate([{color}, {color, offset: 0.8}, {}], {duration: DURATION_MS, delay: delayMs, fill: 'backwards'});
    }
  }
  darkenFrame(element, delayMs);
  let start: number | undefined;
  const step = (now: number) => {
    // Rebuilt view: the node is gone, nothing left to count
    if (!textNode.isConnected) {
      return;
    }
    start ??= now + delayMs;
    const progress = Math.min(1, Math.max(0, (now - start) / DURATION_MS));
    textNode.nodeValue = progress >= 1 ? finalText : format(Math.round(from + (to - from) * easeOut(progress)));
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
  return true;
}
