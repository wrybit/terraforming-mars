// Section rail of the card list (CardListSectionRail.vue): one tick per section at the right edge, magnified like a
// fisheye around the mouse pointer – or, without a pointer, slightly around the section being read.

// Distance between two ticks (px), also the unit of the fisheye's reach
export const RAIL_TICK_SPACING = 26;

// How strongly a tick at `distance` px from the fisheye's centre is magnified: 1 at the centre, fading to 0
// about two ticks away (Gaussian, so the neighbours grow smoothly instead of jumping)
export function fisheyeInfluence(distance: number): number {
  const ticks = distance / RAIL_TICK_SPACING;
  return Math.exp(-(ticks * ticks) / 1.6);
}

// The section being read: the last one whose top edge has reached the sticky line below the header
export function activeSectionIndex(sectionTops: ReadonlyArray<number>, line: number): number {
  let active = 0;
  sectionTops.forEach((top, index) => {
    if (top <= line + 1) {
      active = index;
    }
  });
  return active;
}
