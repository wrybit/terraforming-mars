// Pure geometry of the overlay scrollbars (overlayScrollbars.ts): where the bar lies and how big the thumb is.
// No DOM access here, so it can be tested on its own.

export type ScrollAxis = 'vertical' | 'horizontal';

/** Edges in viewport coordinates. */
export type Box = {left: number, top: number, right: number, bottom: number};

/** Width of the bar; it never changes, not even under the pointer (nothing may jump). */
export const OVERLAY_SCROLLBAR_THICKNESS = 8;
/** Distance between the bar and the border of its box. */
export const OVERLAY_SCROLLBAR_GAP = 3;
/** A scroll area at most this far from the edge of its box gets its bar at the box edge. */
export const OVERLAY_SCROLLBAR_SNAP_DISTANCE = 24;
/** Shortest thumb, so it stays grabbable in very long content. */
export const OVERLAY_SCROLLBAR_MIN_THUMB = 28;
/** The bar fades out this long after the last scroll movement. */
export const OVERLAY_SCROLLBAR_HIDE_DELAY_MS = 1250;

/**
 * Edges the bar runs along: each edge of the scroll area moves to the edge of the surrounding box
 * (tab box, card) when it is close to it. Then the bar sits 3 px from the box border and its round
 * ends follow the box corners, instead of floating somewhere inside the padding.
 */
export function snapToFrame(area: Box, frame: Box): Box {
  const snap = (edge: number, frameEdge: number) => Math.abs(edge - frameEdge) <= OVERLAY_SCROLLBAR_SNAP_DISTANCE ? frameEdge : edge;
  return {
    left: snap(area.left, frame.left),
    top: snap(area.top, frame.top),
    right: snap(area.right, frame.right),
    bottom: snap(area.bottom, frame.bottom),
  };
}

/** Position and size of the bar; with bars in both directions the shared corner stays free. */
export function railBox(edges: Box, axis: ScrollAxis, bothAxes: boolean): Box {
  const corner = bothAxes ? OVERLAY_SCROLLBAR_THICKNESS + OVERLAY_SCROLLBAR_GAP : 0;
  if (axis === 'vertical') {
    const right = edges.right - OVERLAY_SCROLLBAR_GAP;
    return {left: right - OVERLAY_SCROLLBAR_THICKNESS, top: edges.top + OVERLAY_SCROLLBAR_GAP, right, bottom: edges.bottom - OVERLAY_SCROLLBAR_GAP - corner};
  }
  const bottom = edges.bottom - OVERLAY_SCROLLBAR_GAP;
  return {left: edges.left + OVERLAY_SCROLLBAR_GAP, top: bottom - OVERLAY_SCROLLBAR_THICKNESS, right: edges.right - OVERLAY_SCROLLBAR_GAP - corner, bottom};
}

export type ScrollMetrics = {viewport: number, content: number, position: number};

/** Length of the thumb and its offset from the start of the track. */
export function thumbGeometry(metrics: ScrollMetrics, track: number): {length: number, offset: number} {
  const length = Math.min(track, Math.max(OVERLAY_SCROLLBAR_MIN_THUMB, Math.round(track * metrics.viewport / metrics.content)));
  const maxPosition = metrics.content - metrics.viewport;
  const progress = maxPosition > 0 ? Math.min(1, Math.max(0, metrics.position / maxPosition)) : 0;
  return {length, offset: (track - length) * progress};
}

/** Scroll distance for a thumb drag: the thumb follows the pointer exactly. */
export function scrollDeltaForDrag(pointerDelta: number, metrics: ScrollMetrics, track: number): number {
  const free = track - thumbGeometry(metrics, track).length;
  return free > 0 ? pointerDelta * (metrics.content - metrics.viewport) / free : 0;
}
