// Position of the confirmation speech bubble at the space (SpaceConfirmPopover.vue).
// Default to the right of the space; if there isn't enough room up to the window edge (Mars reaches the right), then left.

export type Rect = {left: number, top: number, right: number, bottom: number};
export type PopoverPlacement = {side: 'left' | 'right', left: number, top: number};

const GAP = 12; // Gap space ↔ bubble (room for the arrow)
const EDGE_MARGIN = 8; // Minimum distance to the window edge

export function spaceConfirmPosition(
  space: Rect, popoverWidth: number, popoverHeight: number, viewportWidth: number, viewportHeight: number,
): PopoverPlacement {
  const fitsRight = space.right + GAP + popoverWidth <= viewportWidth - EDGE_MARGIN;
  const side = fitsRight ? 'right' : 'left';
  const left = fitsRight ? space.right + GAP : space.left - GAP - popoverWidth;
  // Vertically centred on the space, but within the window
  const centeredTop = (space.top + space.bottom) / 2 - popoverHeight / 2;
  const top = Math.min(Math.max(centeredTop, EDGE_MARGIN), viewportHeight - EDGE_MARGIN - popoverHeight);
  return {side, left: Math.max(left, EDGE_MARGIN), top};
}
