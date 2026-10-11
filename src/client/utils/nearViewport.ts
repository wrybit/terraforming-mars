// One shared IntersectionObserver for elements that should only render their content once they come near the
// visible area (LazyMount.vue). One observer for all instead of one each: the card list has over a thousand.

// Content is created this far ahead of the visible area, so scrolling at normal speed never shows a gap
const AHEAD = '800px 0px';

const callbacks = new Map<Element, () => void>();
let observer: IntersectionObserver | undefined;

function sharedObserver(): IntersectionObserver {
  if (observer === undefined) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const callback = callbacks.get(entry.target);
          unobserveNearViewport(entry.target);
          callback?.();
        }
      }
    }, {rootMargin: AHEAD});
  }
  return observer;
}

/** Calls `onNear` once, when the element first comes near the visible area. */
export function observeNearViewport(element: Element, onNear: () => void): void {
  // Without IntersectionObserver (old browsers, tests): show right away
  if (typeof IntersectionObserver === 'undefined') {
    onNear();
    return;
  }
  callbacks.set(element, onNear);
  sharedObserver().observe(element);
}

export function unobserveNearViewport(element: Element): void {
  callbacks.delete(element);
  observer?.unobserve(element);
}
