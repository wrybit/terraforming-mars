// What the overlay scrollbars (overlayScrollbars.ts) need to know about a scroll area in the page:
// does it scroll, how far, and in which box its bar lies.
import {Box, ScrollAxis, ScrollMetrics} from '@/client/utils/overlayScrollbarGeometry';

/** Boxes whose border the bar snaps to (tab boxes, cards); more via data-scrollbar-frame. */
const FRAME_SELECTOR = '.or-tab-panel, .card-container, [data-scrollbar-frame]';

/** CSS switch: the mixin .scrollbar-hidden() sets it on areas that scroll without any visible bar. */
const OPT_OUT_PROPERTY = '--overlay-scrollbar';

function pageScroller(): Element {
  return document.scrollingElement ?? document.documentElement;
}

export function isPageScroller(element: Element): boolean {
  return element === pageScroller();
}

/** The scroll area behind a scroll event (the page itself reports the document). */
export function scrollAreaOf(target: EventTarget | null): Element | undefined {
  if (target === document) {
    return pageScroller();
  }
  return target instanceof Element ? target : undefined;
}

/** Areas meant to scroll without a bar (tab strips, carousels) stay without one. */
export function wantsOverlayScrollbar(element: Element): boolean {
  if (isPageScroller(element)) {
    return true;
  }
  const own = getComputedStyle(element).getPropertyValue(OPT_OUT_PROPERTY).trim();
  // Custom properties are inherited: only the element that set it opts out, not its content
  const parent = element.parentElement === null ? '' : getComputedStyle(element.parentElement).getPropertyValue(OPT_OUT_PROPERTY).trim();
  return own !== 'none' || parent === 'none';
}

export function scrollMetrics(element: Element, axis: ScrollAxis): ScrollMetrics {
  return axis === 'vertical' ?
    {viewport: element.clientHeight, content: element.scrollHeight, position: element.scrollTop} :
    {viewport: element.clientWidth, content: element.scrollWidth, position: element.scrollLeft};
}

export function isScrollable(element: Element, axis: ScrollAxis): boolean {
  const metrics = scrollMetrics(element, axis);
  // Rounding of fractional sizes reports a pixel of overflow that cannot be scrolled
  if (metrics.content <= metrics.viewport + 1) {
    return false;
  }
  if (isPageScroller(element)) {
    return true;
  }
  const style = getComputedStyle(element);
  const overflow = axis === 'vertical' ? style.overflowY : style.overflowX;
  return overflow === 'auto' || overflow === 'scroll';
}

/** Inside of the border in viewport coordinates; for the page: the window. */
export function innerBox(element: Element): Box {
  if (isPageScroller(element)) {
    return {left: 0, top: 0, right: element.clientWidth, bottom: element.clientHeight};
  }
  const rect = element.getBoundingClientRect();
  const left = rect.left + element.clientLeft;
  const top = rect.top + element.clientTop;
  return {left, top, right: left + element.clientWidth, bottom: top + element.clientHeight};
}

/** Box whose border the bar of this area may snap to; without one, the area itself. */
export function frameOf(element: Element): Element {
  return isPageScroller(element) ? element : (element.closest(FRAME_SELECTOR) ?? element);
}
