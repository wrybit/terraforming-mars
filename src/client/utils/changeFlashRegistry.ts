// Elements carrying v-flash, grouped by key, plus whether they are on screen right now.
// A pending change blinks as soon as one of its elements becomes visible: immediately,
// after switching to its tab, after scrolling to it, or when the browser tab comes back to front.
import {isChangePending, markChangeSeen, previousValueOf} from '@/client/utils/changeTracker';
import {scheduleEffect} from '@/client/utils/changeFlashScheduler';
import {flashElement} from '@/client/utils/changeFlashAnimation';
import {countElement} from '@/client/utils/changeFlashCount';

// blink: light up with ripples; count / countSigned: the number counts from the old value (resources)
export type FlashEffect = 'blink' | 'count' | 'countSigned';

const elementsByKey = new Map<string, Set<HTMLElement>>();
// One element can stand for several values (e.g. a goods cell: stock and production)
const keysOfElement = new WeakMap<HTMLElement, ReadonlyArray<string>>();
const visibleElements = new Set<HTMLElement>();
const effectOfElement = new WeakMap<HTMLElement, FlashEffect>();
let observer: IntersectionObserver | undefined;

function intersectionObserver(): IntersectionObserver | undefined {
  // jsdom (client tests) has no IntersectionObserver: nothing blinks there
  if (observer === undefined && typeof IntersectionObserver === 'function') {
    observer = new IntersectionObserver(onIntersection);
    document.addEventListener('visibilitychange', revealVisibleChanges);
  }
  return observer;
}

function onIntersection(entries: Array<IntersectionObserverEntry>): void {
  for (const entry of entries) {
    const element = entry.target as HTMLElement;
    if (entry.isIntersecting) {
      visibleElements.add(element);
    } else {
      visibleElements.delete(element);
    }
  }
  revealVisibleChanges();
}

// Browser tab in the background: wait, the viewer should see the blink
function revealVisibleChanges(): void {
  if (document.hidden) {
    return;
  }
  const flashed = new Set<HTMLElement>();
  for (const [key, elements] of elementsByKey) {
    if (!isChangePending(key)) {
      continue;
    }
    const visible = Array.from(elements).filter((element) => visibleElements.has(element));
    if (visible.length > 0) {
      const from = parseFloat(previousValueOf(key) ?? '');
      markChangeSeen(key);
      // An element standing for several changed values blinks only once
      const fresh = visible.filter((element) => !flashed.has(element));
      fresh.forEach((element) => flashed.add(element));
      if (fresh.length > 0) {
        scheduleEffect((delayMs) => fresh.forEach((element) => runEffect(element, from, delayMs)));
      }
    }
  }
}

function runEffect(element: HTMLElement, from: number, delayMs: number): void {
  const effect = effectOfElement.get(element) ?? 'blink';
  const counted = effect !== 'blink' && countElement(element, from, effect === 'countSigned', delayMs);
  if (!counted) {
    flashElement(element, delayMs);
  }
}

export function registerFlashElement(element: HTMLElement, keys: ReadonlyArray<string>, effect: FlashEffect = 'blink'): void {
  const observing = intersectionObserver();
  if (observing === undefined || keys.length === 0) {
    return;
  }
  keysOfElement.set(element, keys);
  effectOfElement.set(element, effect);
  for (const key of keys) {
    let elements = elementsByKey.get(key);
    if (elements === undefined) {
      elements = new Set();
      elementsByKey.set(key, elements);
    }
    elements.add(element);
  }
  observing.observe(element);
}

export function unregisterFlashElement(element: HTMLElement): void {
  const keys = keysOfElement.get(element);
  if (keys === undefined) {
    return;
  }
  observer?.unobserve(element);
  visibleElements.delete(element);
  keysOfElement.delete(element);
  for (const key of keys) {
    const elements = elementsByKey.get(key);
    elements?.delete(element);
    if (elements?.size === 0) {
      elementsByKey.delete(key);
    }
  }
}

export function flashKeysOf(element: HTMLElement): ReadonlyArray<string> {
  return keysOfElement.get(element) ?? [];
}

export function hasFlashElement(key: string): boolean {
  return elementsByKey.has(key);
}

export function isFlashElementVisible(key: string): boolean {
  return Array.from(elementsByKey.get(key) ?? []).some((element) => visibleElements.has(element));
}
