// Scrollbars like Safari on every mouse device (Windows bars are wide and grey and break the layout):
// the native bars are hidden (overlay_scrollbar.less), instead a thin bar lies on top of the content,
// appears while scrolling and fades out after a pause. Touch devices keep their own, already subtle bars.
import {isScrollable, scrollAreaOf, wantsOverlayScrollbar} from '@/client/utils/overlayScrollbarArea';
import {OVERLAY_SCROLLBAR_GAP, OVERLAY_SCROLLBAR_HIDE_DELAY_MS, OVERLAY_SCROLLBAR_SNAP_DISTANCE, ScrollAxis} from '@/client/utils/overlayScrollbarGeometry';
import {OverlayScrollbarRail, railBoxOf} from '@/client/utils/overlayScrollbarRail';

const AXES: ReadonlyArray<ScrollAxis> = ['vertical', 'horizontal'];
// Extra hover zone in front of the bar, so the thin bar is easy to hit
const HOVER_SLACK = 6;

type AreaState = {rails: Partial<Record<ScrollAxis, OverlayScrollbarRail>>, hideTimer: number | undefined};

const areas = new Map<Element, AreaState>();
let hovered: {area: Element, axis: ScrollAxis} | undefined;

function stateOf(area: Element): AreaState {
  let state = areas.get(area);
  if (state === undefined) {
    state = {rails: {}, hideTimer: undefined};
    areas.set(area, state);
  }
  return state;
}

function railsOf(area: Element): Array<OverlayScrollbarRail> {
  return Object.values(areas.get(area)?.rails ?? {});
}

function show(area: Element): void {
  if (!wantsOverlayScrollbar(area)) {
    return;
  }
  const state = stateOf(area);
  for (const axis of AXES) {
    if (!isScrollable(area, axis)) {
      state.rails[axis]?.hide();
      continue;
    }
    state.rails[axis] ??= new OverlayScrollbarRail(area, axis, () => scheduleHide(area));
    state.rails[axis].show();
  }
  scheduleHide(area);
}

function scheduleHide(area: Element): void {
  const state = areas.get(area);
  if (state === undefined) {
    return;
  }
  window.clearTimeout(state.hideTimer);
  state.hideTimer = window.setTimeout(() => {
    const rails = railsOf(area);
    // Area gone (component unmounted): drop its bars
    if (!area.isConnected) {
      rails.forEach((rail) => rail.remove());
      areas.delete(area);
      return;
    }
    // Stays while dragged or under the pointer
    if (rails.some((rail) => rail.isDragging || rail.isHovered)) {
      return;
    }
    rails.forEach((rail) => rail.hide());
  }, OVERLAY_SCROLLBAR_HIDE_DELAY_MS);
}

function hitAxis(area: Element, x: number, y: number): ScrollAxis | undefined {
  if (!wantsOverlayScrollbar(area)) {
    return undefined;
  }
  return AXES.find((axis) => {
    if (!isScrollable(area, axis)) {
      return false;
    }
    const box = railBoxOf(area, axis);
    return axis === 'vertical' ?
      x >= box.left - HOVER_SLACK && x <= box.right + OVERLAY_SCROLLBAR_GAP && y >= box.top && y <= box.bottom :
      y >= box.top - HOVER_SLACK && y <= box.bottom + OVERLAY_SCROLLBAR_GAP && x >= box.left && x <= box.right;
  });
}

// Areas the pointer may be on the bar of: under the pointer, and a little further inside – the bar can lie
// in the padding of the tab box, outside of its scroll area
function candidates(x: number, y: number): Array<Element> {
  const result: Array<Element> = [];
  const starts = [
    document.elementFromPoint(x, y),
    document.elementFromPoint(x - OVERLAY_SCROLLBAR_SNAP_DISTANCE, y),
    document.elementFromPoint(x, y - OVERLAY_SCROLLBAR_SNAP_DISTANCE),
  ];
  for (const start of starts) {
    for (let element = start; element !== null; element = element.parentElement) {
      if (!result.includes(element) && !element.classList.contains('overlay-scrollbar')) {
        result.push(element);
      }
    }
  }
  result.push(document.scrollingElement ?? document.documentElement);
  return result;
}

function setHovered(next: {area: Element, axis: ScrollAxis} | undefined): void {
  if (hovered !== undefined && (next === undefined || next.area !== hovered.area || next.axis !== hovered.axis)) {
    const previous = hovered;
    stateOf(previous.area).rails[previous.axis]?.setHovered(false);
    scheduleHide(previous.area);
  }
  hovered = next;
  if (next !== undefined) {
    show(next.area);
    stateOf(next.area).rails[next.axis]?.setHovered(true);
  }
}

function onPointerMove(event: PointerEvent): void {
  if (event.pointerType === 'touch' || railsOf(hovered?.area ?? document.body).some((rail) => rail.isDragging)) {
    return;
  }
  // Pointer on the bar itself: stays with its area
  if (hovered !== undefined && event.target instanceof Element && event.target.closest('.overlay-scrollbar') !== null) {
    return;
  }
  let found: {area: Element, axis: ScrollAxis} | undefined;
  for (const area of candidates(event.clientX, event.clientY)) {
    const axis = hitAxis(area, event.clientX, event.clientY);
    if (axis !== undefined) {
      found = {area, axis};
      break;
    }
  }
  setHovered(found);
}

function throttled<T>(handler: (value: T) => void): (value: T) => void {
  let pending: T | undefined;
  return (value: T) => {
    if (pending === undefined) {
      window.requestAnimationFrame(() => {
        const latest = pending as T;
        pending = undefined;
        handler(latest);
      });
    }
    pending = value;
  };
}

/** Only with a mouse or trackpad; touch screens keep their native bars. */
export function overlayScrollbarsWanted(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** Switches the whole app to overlay scrollbars; once at startup (main.ts). */
export function installOverlayScrollbars(): void {
  if (!overlayScrollbarsWanted()) {
    return;
  }
  document.documentElement.classList.add('overlay-scrollbars');
  // Areas scrolled since the last frame: several can scroll at once (scroll chaining, scripts)
  const scrolled = new Set<Element>();
  const onScroll = (event: Event) => {
    const area = scrollAreaOf(event.target);
    if (area === undefined) {
      return;
    }
    if (scrolled.size === 0) {
      window.requestAnimationFrame(() => {
        scrolled.forEach(show);
        scrolled.clear();
      });
    }
    scrolled.add(area);
  };
  // Capture: scroll events do not bubble
  document.addEventListener('scroll', onScroll, {capture: true, passive: true});
  document.addEventListener('pointermove', throttled(onPointerMove), {passive: true});
  // Layout changes move the areas: hide the bars, the next scroll shows them in the right place
  window.addEventListener('resize', () => areas.forEach((state) => Object.values(state.rails).forEach((rail) => rail.hide())));
}
