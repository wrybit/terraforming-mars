/* Mars without the scale ring: section of the board (.board-cont, px at zoom 1) with the planet and room on both
   sides for the columns of outer spaces. Start screen (mobileFit.ts) and large Mars (BoardZoomModal) show
   the same section so proportions and position of the outer spaces match. */
export const MARS_CROP = {left: 14, top: 62, width: 606, height: 486};
/* Mars with the scale ring: section of the board (.board-cont, px at zoom 1) with the ring, its bonus chips and room on
   both sides for the columns of special spaces off Mars (Board.vue, outerSpaces.ts) – wider than the board itself. */
export const RING_FRAME = {left: -36, top: -22, width: 740, height: 622};

export type MarsFrame = {left: number, top: number, width: number, height: number};

/* Visible section of the Mars board: the planet alone without ring (mobile view without Venus) or the ring
   with the outer space columns. Tab, large Mars and game end show the same section so nothing jumps. */
export function marsFrame(cropped: boolean): MarsFrame {
  return cropped ? MARS_CROP : RING_FRAME;
}
/* The planet alone (mars-planet.png without transparent edge), px at zoom 1 relative to .board-cont: board previews without scales and outer spaces. */
export const PLANET_BOUNDS = {left: 93, top: 86, width: 449, height: 449};
/* Center of the planet relative to the top left corner of the board (.board-cont), px at zoom 1. */
export const PLANET_CENTER = {x: 316, y: 310};
// Room for status bar, header and zoom bar of the large Mars
const CHROME_HEIGHT = 170;
const SIDE_MARGIN = 16;
// Zoom relative to the whole planet (1 = 100 %): start on opening, maximum, step size of − and +
export const DEFAULT_ZOOM_RATIO = 2;
export const MAX_ZOOM_RATIO = 3;
export const ZOOM_STEP_RATIO = 0.25;

/* Next step on the 25 % grid in direction `direction` (+1 larger, −1 smaller), limited to 100–300 %. */
export function steppedZoomRatio(ratio: number, direction: 1 | -1): number {
  // Intermediate values (after a pinch) snap to the next step in the direction of movement
  const position = ratio / ZOOM_STEP_RATIO;
  const steps = direction > 0 ? Math.floor(position + 1e-6) + 1 : Math.ceil(position - 1e-6) - 1;
  return Math.min(MAX_ZOOM_RATIO, Math.max(1, steps * ZOOM_STEP_RATIO));
}

/* Zoom at which the whole section `frame` (planet including colony spaces) fits into a `width` × `height` px window – without scrolling. */
export function wholePlanetZoom(width: number, height: number, frame: MarsFrame = MARS_CROP): number {
  return Math.min((width - 2 * SIDE_MARGIN) / frame.width, (height - CHROME_HEIGHT) / frame.height);
}
