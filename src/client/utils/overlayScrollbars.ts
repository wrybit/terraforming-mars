// Scrollbars like Safari on every mouse device (Windows bars are wide and grey and break the layout):
// the native bars are hidden (overlay_scrollbar.less), instead a thin bar lies on top of the content,
// appears while scrolling and fades out after a pause. Touch devices keep their own, already subtle bars.
import {isScrollable, scrollAreaOf, wantsOverlayScrollbar} from '@/client/utils/overlayScrollbarArea';
import {OVERLAY_SCROLLBAR_HIDE_DELAY_MS, ScrollAxis, boxContains} from '@/client/utils/overlayScrollbarGeometry';
import {OverlayScrollbarRail} from '@/client/utils/overlayScrollbarRail';

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

// Bar under the pointer, judged from the boxes cached when the bars were placed: no element
// hit testing and no style reads per pointer move (that was the bulk of the work before).
function hitRail(x: number, y: number): {area: Element, axis: ScrollAxis} | undefined {
  let found: {area: Element, axis: ScrollAxis} | undefined;
  for (const [area, state] of areas) {
    for (const axis of AXES) {
      const box = state.rails[axis]?.cachedBox();
      if (box !== undefined && boxContains(box, x, y, HOVER_SLACK)) {
        found = {area, axis};
      }
    }
  }
  return found;
}

function anyDragging(): boolean {
  for (const state of areas.values()) {
    for (const rail of Object.values(state.rails)) {
      if (rail?.isDragging === true) {
        return true;
      }
    }
  }
  return false;
}

function setHovered(next: {area: Element, axis: ScrollAxis} | undefined): void {
  if (hovered !== undefined && (next === undefined || next.area !== hovered.area || next.axis !== hovered.axis)) {
    const previous = hovered;
    stateOf(previous.area).rails[previous.axis]?.setHovered(false);
    scheduleHide(previous.area);
  }
  const changed = next !== undefined && (hovered === undefined || next.area !== hovered.area || next.axis !== hovered.axis);
  hovered = next;
  if (next !== undefined && changed) {
    // Placing the bar reads the layout: only when the hovered bar changes, not on every move over it
    show(next.area);
    stateOf(next.area).rails[next.axis]?.setHovered(true);
  }
}

function onPointerMove(event: PointerEvent): void {
  if (event.pointerType === 'touch' || anyDragging()) {
    return;
  }
  setHovered(hitRail(event.clientX, event.clientY));
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
