// What the overlay scrollbars (overlayScrollbars.ts) need to know about a scroll area in the page:
// does it scroll, how far, and in which box its bar lies.
import {Box, ScrollAxis, ScrollMetrics} from '@/client/utils/overlayScrollbarGeometry';

/** Boxes whose border the bar snaps to (tab boxes, cards); more via data-scrollbar-frame. */
const FRAME_SELECTOR = '.or-tab-panel, .card-container, [data-scrollbar-frame]';

/** CSS switch: the mixin .scrollbar-hidden() sets it on areas that scroll without any visible bar. */
const OPT_OUT_PROPERTY = '--overlay-scrollbar';

/** CSS length kept free at the end of a vertical bar (registered with inherits: false in overlay_scrollbar.less). */
const END_INSET_PROPERTY = '--overlay-scrollbar-end-inset';

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

/** Factor by which a CSS transform (e.g. the zoomed card, scale 1.2) enlarges the element on screen. */
function screenScale(element: Element): {x: number, y: number} {
  if (!(element instanceof HTMLElement) || element.offsetWidth === 0 || element.offsetHeight === 0) {
    return {x: 1, y: 1};
  }
  const rect = element.getBoundingClientRect();
  return {x: rect.width / element.offsetWidth, y: rect.height / element.offsetHeight};
}

/** Inside of the border in viewport coordinates; for the page: the window. */
export function innerBox(element: Element): Box {
  if (isPageScroller(element)) {
    return {left: 0, top: 0, right: element.clientWidth, bottom: element.clientHeight};
  }
  // client* sizes ignore transforms, getBoundingClientRect does not: without converting, the bar of a
  // transformed card (zoom) lands in the middle of the content instead of at its edge
  const rect = element.getBoundingClientRect();
  const scale = screenScale(element);
  const left = rect.left + element.clientLeft * scale.x;
  const top = rect.top + element.clientTop * scale.y;
  return {left, top, right: left + element.clientWidth * scale.x, bottom: top + element.clientHeight * scale.y};
}

/**
 * Length kept free at the end of the bar (CSS --overlay-scrollbar-end-inset, not inherited),
 * e.g. the points badge in the lower right corner of a card, which the bar would cover otherwise.
 */
export function endInset(element: Element): number {
  if (isPageScroller(element)) {
    return 0;
  }
  const inset = parseFloat(getComputedStyle(element).getPropertyValue(END_INSET_PROPERTY));
  return Number.isFinite(inset) ? inset * screenScale(element).y : 0;
}

/** Box whose border the bar of this area may snap to; without one, the area itself. */
export function frameOf(element: Element): Element {
  return isPageScroller(element) ? element : (element.closest(FRAME_SELECTOR) ?? element);
}
