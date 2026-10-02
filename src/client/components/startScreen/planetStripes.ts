/* Planet stripes of the start page: position of the stripes in planet-stripes.jpg and geometry of the globe
   that the menu buttons form together. All measures in the 369 grid of the old sprite planets.jpg
   (369 × 810, rows of 90px, row 0 = title), so title background and buttons show the same globe. */

export const STRIPES_TEXTURE_URL = 'assets/buttons-homepage/planet-stripes.jpg';
export const STRIPES_TEXTURE_SIZE = {width: 1942, height: 809} as const;

// One button corresponds to this area in the sprite grid
export const SPRITE_ROW = {width: 369, height: 90} as const;

// Globe circle, determined by a circle fit to the planet edge of planets.jpg
export const GLOBE = {centerX: -174.7, centerY: 402.5, radius: 522} as const;

export type PlanetStripeName = 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'darkBlue' | 'neptune' | 'moon';

export type PlanetStripe = {
  // Top edge and height in original texture pixels (measured from the color jumps)
  top: number;
  height: number;
  // Texture column that sits at the left button edge at rest; the bottom stripe is colored only on the right
  startX: number;
};

const DEFAULT_START_X = 700;

// At the stripe boundaries there are bright dividing lines and the neighboring stripe: cut off this much at top and bottom
// (texture pixels) so that only the own stripe is visible – even with smoothing when scaling
export const STRIPE_EDGE_TRIM = 2;

/** Visible part of a stripe without the edges. */
export function trimmedStripe(stripe: PlanetStripe): PlanetStripe {
  return {...stripe, top: stripe.top + STRIPE_EDGE_TRIM, height: stripe.height - 2 * STRIPE_EDGE_TRIM};
}

export const PLANET_STRIPES: Readonly<Record<PlanetStripeName, PlanetStripe>> = {
  venus: {top: 102, height: 86, startX: DEFAULT_START_X},
  earth: {top: 188, height: 85, startX: DEFAULT_START_X},
  mars: {top: 273, height: 86, startX: DEFAULT_START_X},
  jupiter: {top: 359, height: 93, startX: DEFAULT_START_X},
  saturn: {top: 452, height: 88, startX: DEFAULT_START_X},
  neptune: {top: 540, height: 89, startX: DEFAULT_START_X},
  moon: {top: 629, height: 80, startX: DEFAULT_START_X},
  darkBlue: {top: 709, height: 100, startX: 1130},
};

// Usable area of the texture in x: outside it the stripe ends are round or black (with a margin, so the
// rounding never becomes visible)
const TEXTURE_USABLE = {left: 300, right: 1700};
// Visible surface arc length from the left button edge to the planet edge (at the equator, sprite pixels)
const VISIBLE_ARC = 650;

/** How far a stripe can rotate in each direction until the texture ends (sprite pixels of surface). */
export function rotationLimits(stripe: PlanetStripe): {min: number, max: number} {
  const scale = SPRITE_ROW.height / stripe.height;
  return {
    max: (stripe.startX - TEXTURE_USABLE.left) * scale,
    min: Math.min(0, (stripe.startX + VISIBLE_ARC / scale - TEXTURE_USABLE.right) * scale),
  };
}
