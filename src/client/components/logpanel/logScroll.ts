// Scroll helpers for the log stream: the log scrolls either inside its own box (desktop, game end)
// or with the whole page (mobile, where the box grows with its content). Everything here works for both.

export type ScrollContainer = HTMLElement | Window;

// Breathing space between the reading line and a header scrolled to
export const HEADER_SCROLL_GAP = 8;

// Height of the soft fade at the top and bottom edge of the log box; the top fade is not part of the reading area
export const LOG_EDGE_FADE = 24;

// A header counts as reached once it is this close to the reading line (covers the gap above and rounding)
const READING_LINE_TOLERANCE = HEADER_SCROLL_GAP + 4;

// The log's own box when it is a scroll box (even while its content is still short), otherwise the nearest
// ancestor that actually scrolls, otherwise the page. Ancestors only count with overflowing content:
// .mb-screen has a computed overflow-y of auto (because of overflow-x: hidden) without ever scrolling.
export function findScrollContainer(element: HTMLElement | undefined): ScrollContainer {
  // body and html never count: their overflow belongs to the page (window), even when computed as auto
  for (let current = element ?? null; current !== null && current !== document.body; current = current.parentElement) {
    const overflowY = getComputedStyle(current).overflowY;
    const scrollable = overflowY === 'auto' || overflowY === 'scroll';
    if (scrollable && (current === element || current.scrollHeight > current.clientHeight + 1)) {
      return current;
    }
  }
  return window;
}

function isWindow(container: ScrollContainer): container is Window {
  return container === window;
}

export function scrollTopOf(container: ScrollContainer): number {
  return isWindow(container) ? window.scrollY : container.scrollTop;
}

export function maxScrollTopOf(container: ScrollContainer): number {
  if (isWindow(container)) {
    const page = document.scrollingElement ?? document.documentElement;
    return Math.max(0, page.scrollHeight - window.innerHeight);
  }
  return Math.max(0, container.scrollHeight - container.clientHeight);
}

export function scrollContainerTo(container: ScrollContainer, top: number, behavior: 'auto' | 'smooth' = 'auto'): void {
  const clamped = Math.max(0, Math.min(top, maxScrollTopOf(container)));
  if (isWindow(container)) {
    window.scrollTo({top: clamped, behavior});
  } else if (behavior === 'auto' || typeof container.scrollTo !== 'function') {
    container.scrollTop = clamped;
  } else {
    container.scrollTo({top: clamped, behavior});
  }
}

// Viewport y where the reading starts: top of the scrolling box below its edge fade, or – when the page scrolls –
// the lower edge of the sticky generation tabs
export function readingLineOf(container: ScrollContainer, tabBar: HTMLElement | undefined): number {
  const containerTop = isWindow(container) ? 0 : container.getBoundingClientRect().top;
  const tabBarBottom = tabBar?.getBoundingClientRect().bottom ?? 0;
  return isWindow(container) ? Math.max(containerTop, tabBarBottom) : containerTop + LOG_EDGE_FADE;
}

// Fade heights for the top and bottom edge: they grow with the content hidden beyond that edge, so the
// start and the end of the log stay crisp and the fade only appears once there is something to scroll to
export function edgeFadesOf(container: HTMLElement): {top: number, bottom: number} {
  const top = scrollTopOf(container);
  return {
    top: Math.min(top, LOG_EDGE_FADE),
    bottom: Math.min(Math.max(0, maxScrollTopOf(container) - top), LOG_EDGE_FADE),
  };
}

// Index of the section the reader is in: the last one whose header has reached the reading line
export function activeSectionIndex(sectionTops: Array<number>, readingLine: number): number {
  let active = 0;
  sectionTops.forEach((top, index) => {
    if (top <= readingLine + READING_LINE_TOLERANCE) {
      active = index;
    }
  });
  return active;
}
