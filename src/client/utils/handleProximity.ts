// Drag handles between the cards of the player view are invisible until the mouse approaches:
// the closer the pointer, the more visible (up to 50 %, resize_handle.less); pressed they show at 90 %.
// One shared pointer listener for all handles writes the closeness (0 … 1) as a CSS variable on each handle.

// Contract with resize_handle.less
export const PROXIMITY_VARIABLE = '--handle-proximity';
export const ACTIVE_CLASS = 'resize-handle--active';
// From this distance in px on, the handle starts to fade in
export const PROXIMITY_RADIUS = 120;

const handles = new Set<HTMLElement>();
let lastPointer: {x: number; y: number} | undefined;
let frame: number | undefined;

// Distance of a point to a rectangle (0 inside)
export function distanceToRect(x: number, y: number, rect: {left: number; right: number; top: number; bottom: number}): number {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}

// Closeness 1 on the handle, falling linearly to 0 at the radius
export function proximity(distance: number): number {
  return Math.max(0, 1 - distance / PROXIMITY_RADIUS);
}

function update(): void {
  frame = undefined;
  for (const handle of handles) {
    const value = lastPointer === undefined ? 0 : proximity(distanceToRect(lastPointer.x, lastPointer.y, handle.getBoundingClientRect()));
    handle.style.setProperty(PROXIMITY_VARIABLE, value.toFixed(3));
  }
}

function schedule(): void {
  if (frame === undefined) {
    frame = requestAnimationFrame(update);
  }
}

function onPointerMove(event: PointerEvent): void {
  // Touch has no approaching pointer; there the handles only show while dragging
  if (event.pointerType === 'touch') {
    return;
  }
  lastPointer = {x: event.clientX, y: event.clientY};
  schedule();
}

// Pointer leaves the window: fade out all handles
function onPointerOut(event: PointerEvent): void {
  if (event.relatedTarget === null) {
    lastPointer = undefined;
    schedule();
  }
}

export function trackHandleProximity(handle: HTMLElement): void {
  if (handles.size === 0) {
    document.addEventListener('pointermove', onPointerMove, {passive: true});
    document.addEventListener('pointerout', onPointerOut, {passive: true});
  }
  handles.add(handle);
}

export function untrackHandleProximity(handle: HTMLElement): void {
  handles.delete(handle);
  if (handles.size === 0) {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerout', onPointerOut);
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }
  }
}
