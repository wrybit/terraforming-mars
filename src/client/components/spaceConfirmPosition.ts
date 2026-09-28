// Lage der Bestätigungs-Sprechblase am Feld (SpaceConfirmPopover.vue).
// Standard rechts vom Feld; reicht der Platz bis zum Fensterrand nicht (Mars reicht bis rechts), dann links.

export type Rect = {left: number, top: number, right: number, bottom: number};
export type PopoverPlacement = {side: 'left' | 'right', left: number, top: number};

const GAP = 12; // Abstand Feld ↔ Blase (Platz für den Pfeil)
const EDGE_MARGIN = 8; // Mindestabstand zum Fensterrand

export function spaceConfirmPosition(
  space: Rect, popoverWidth: number, popoverHeight: number, viewportWidth: number, viewportHeight: number,
): PopoverPlacement {
  const fitsRight = space.right + GAP + popoverWidth <= viewportWidth - EDGE_MARGIN;
  const side = fitsRight ? 'right' : 'left';
  const left = fitsRight ? space.right + GAP : space.left - GAP - popoverWidth;
  // Senkrecht mittig zum Feld, aber innerhalb des Fensters
  const centeredTop = (space.top + space.bottom) / 2 - popoverHeight / 2;
  const top = Math.min(Math.max(centeredTop, EDGE_MARGIN), viewportHeight - EDGE_MARGIN - popoverHeight);
  return {side, left: Math.max(left, EDGE_MARGIN), top};
}
