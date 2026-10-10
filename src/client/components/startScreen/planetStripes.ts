/* Planet stripes of the start page: position of the stripes in planet-stripes.jpg and geometry of the globe
   that the menu buttons form together. All measures in the 369 grid of the old sprite planets.jpg
   (369 × 810, rows of 90px, row 0 = title), so title background and buttons show the same globe. */

export const STRIPES_TEXTURE_URL = 'assets/buttons-homepage/planet-stripes.jpg';
export const STRIPES_TEXTURE_SIZE = {width: 2163, height: 727} as const;

// One button corresponds to this area in the sprite grid
export const SPRITE_ROW = {width: 369, height: 90} as const;

// Globe circle, determined by a circle fit to the planet edge of planets.jpg
export const GLOBE = {centerX: -174.7, centerY: 402.5, radius: 522} as const;

export type PlanetStripeName = 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'darkBlue' | 'neptune' | 'moon';

export type PlanetStripe = {
  // Top edge and height in original texture pixels (measured from the color jumps)
  top: number;
  height: number;
  // Texture column that sits at the left button edge at rest
  startX: number;
};

// Rest position in the middle of the texture: the same room to rotate in both directions
const DEFAULT_START_X = 790;

// At the stripe boundaries there are bright dividing lines and the neighboring stripe (about 3 rows of transition):
// cut off this much at top and bottom (texture pixels) so that only the own stripe is visible – even with smoothing
export const STRIPE_EDGE_TRIM = 3;

/** Visible part of a stripe without the edges. */
export function trimmedStripe(stripe: PlanetStripe): PlanetStripe {
  return {...stripe, top: stripe.top + STRIPE_EDGE_TRIM, height: stripe.height - 2 * STRIPE_EDGE_TRIM};
}

export const PLANET_STRIPES: Readonly<Record<PlanetStripeName, PlanetStripe>> = {
  venus: {top: 90, height: 79, startX: DEFAULT_START_X},
  earth: {top: 169, height: 79, startX: DEFAULT_START_X},
  mars: {top: 248, height: 95, startX: DEFAULT_START_X},
  jupiter: {top: 343, height: 84, startX: DEFAULT_START_X},
  saturn: {top: 427, height: 67, startX: DEFAULT_START_X},
  neptune: {top: 494, height: 74, startX: DEFAULT_START_X},
  moon: {top: 568, height: 75, startX: DEFAULT_START_X},
  // Dark on the left, blue only towards the right: rest position further right, like before
  darkBlue: {top: 643, height: 84, startX: 1350},
};
// Usable area of the texture in x: the stripes run from edge to edge; a few pixels stay off so JPEG edge
// artifacts and smoothing never show
export const TEXTURE_USABLE = {left: 4, right: STRIPES_TEXTURE_SIZE.width - 4};
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
