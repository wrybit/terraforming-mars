// Shared placement of floating hover previews (log cards, game end details): at the top right of the mouse pointer;
// if there is no room, flipped to the left of it or pushed down, always inside the window.

// Mouse position in window coordinates
export type CursorPosition = {x: number, y: number};
export type PanelSize = {width: number, height: number};

// Gap between the mouse pointer and the preview's nearest corner
const CURSOR_GAP = 16;
// Minimum distance of the preview from the window edges
const VIEWPORT_MARGIN = 8;

export function floatingPlacement(cursor: CursorPosition, size: PanelSize): {left: number, top: number} {
  let left = cursor.x + CURSOR_GAP;
  if (left + size.width > window.innerWidth - VIEWPORT_MARGIN) {
    left = Math.max(VIEWPORT_MARGIN, cursor.x - CURSOR_GAP - size.width);
  }
  const top = Math.min(
    Math.max(VIEWPORT_MARGIN, cursor.y - CURSOR_GAP - size.height),
    window.innerHeight - VIEWPORT_MARGIN - size.height);
  return {left, top: Math.max(VIEWPORT_MARGIN, top)};
}
