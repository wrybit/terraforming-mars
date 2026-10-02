/*
 * Zoom gestures on a scrollable area: two fingers to zoom, double tap to toggle,
 * Ctrl + mouse wheel on a computer. Panning is handled by the area's normal scrolling.
 */

/* Callback to the owner of the zoom: change the factor relatively or toggle between two levels. */
export type PinchZoomTarget = {
  // Changes the zoom by `factor`; the point (`x`, `y`, window coordinates) stays in place
  zoomBy(factor: number, x: number, y: number): void;
  // Double tap at (`x`, `y`)
  toggle(x: number, y: number): void;
};

const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_DISTANCE = 30;
const WHEEL_STEP = 1.1;

/* Attaches the gestures to `element` and returns the function that removes them again. */
export function attachPinchZoom(element: HTMLElement, target: PinchZoomTarget): () => void {
  const pointers = new Map<number, {x: number, y: number}>();
  let lastDistance = 0;
  let lastTap = {time: 0, x: 0, y: 0};

  const distance = () => {
    const [a, b] = Array.from(pointers.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const middle = () => {
    const [a, b] = Array.from(pointers.values());
    return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
  };

  const down = (event: PointerEvent) => {
    pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (pointers.size === 2) {
      lastDistance = distance();
    }
  };
  const move = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId)) {
      return;
    }
    pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (pointers.size === 2 && lastDistance > 0) {
      const now = distance();
      const center = middle();
      target.zoomBy(now / lastDistance, center.x, center.y);
      lastDistance = now;
    }
  };
  const up = (event: PointerEvent) => {
    const wasPinch = pointers.size > 1;
    pointers.delete(event.pointerId);
    lastDistance = 0;
    if (wasPinch || event.pointerType === 'mouse') {
      return;
    }
    const now = Date.now();
    const near = Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < DOUBLE_TAP_DISTANCE;
    if (now - lastTap.time < DOUBLE_TAP_MS && near) {
      target.toggle(event.clientX, event.clientY);
      lastTap = {time: 0, x: 0, y: 0};
    } else {
      lastTap = {time: now, x: event.clientX, y: event.clientY};
    }
  };
  const wheel = (event: WheelEvent) => {
    if (!event.ctrlKey) {
      return;
    }
    event.preventDefault();
    target.zoomBy(event.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP, event.clientX, event.clientY);
  };
  const dblclick = (event: MouseEvent) => target.toggle(event.clientX, event.clientY);

  element.addEventListener('pointerdown', down);
  element.addEventListener('pointermove', move);
  element.addEventListener('pointerup', up);
  element.addEventListener('pointercancel', up);
  element.addEventListener('wheel', wheel, {passive: false});
  element.addEventListener('dblclick', dblclick);
  return () => {
    element.removeEventListener('pointerdown', down);
    element.removeEventListener('pointermove', move);
    element.removeEventListener('pointerup', up);
    element.removeEventListener('pointercancel', up);
    element.removeEventListener('wheel', wheel);
    element.removeEventListener('dblclick', dblclick);
  };
}
