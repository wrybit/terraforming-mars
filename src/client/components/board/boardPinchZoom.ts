/*
 * Zoom-Gesten auf einem scrollbaren Bereich: zwei Finger zum Zoomen, Doppel-Tap zum Umschalten,
 * Strg + Mausrad am Rechner. Das Verschieben übernimmt das normale Scrollen des Bereichs.
 */

/* Rückmeldung an den Besitzer des Zooms: Faktor relativ ändern bzw. zwischen zwei Stufen umschalten. */
export type PinchZoomTarget = {
  // Ändert den Zoom um `factor`; der Punkt (`x`, `y`, Fenster-Koordinaten) bleibt an seiner Stelle
  zoomBy(factor: number, x: number, y: number): void;
  // Doppel-Tap an (`x`, `y`)
  toggle(x: number, y: number): void;
};

const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_DISTANCE = 30;
const WHEEL_STEP = 1.1;

/* Hängt die Gesten an `element` und liefert die Funktion, die sie wieder entfernt. */
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
