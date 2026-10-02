/* Planeten-Streifen der Startseite: Lage der Streifen in planet-stripes.jpg und Geometrie des Globus,
   den die Menü-Buttons zusammen bilden. Alle Maße im 369er-Raster des alten Sprites planets.jpg
   (369 × 810, Reihen à 90px, Reihe 0 = Titel), damit Titel-Hintergrund und Buttons denselben Globus zeigen. */

export const STRIPES_TEXTURE_URL = 'assets/buttons-homepage/planet-stripes.jpg';
export const STRIPES_TEXTURE_SIZE = {width: 1942, height: 809} as const;

// Ein Button entspricht im Sprite-Raster dieser Fläche
export const SPRITE_ROW = {width: 369, height: 90} as const;

// Globus-Kreis, per Kreis-Fit aus dem Planetenrand von planets.jpg bestimmt
export const GLOBE = {centerX: -174.7, centerY: 402.5, radius: 522} as const;

export type PlanetStripeName = 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'darkBlue' | 'neptune' | 'moon';

export type PlanetStripe = {
  // Oberkante und Höhe in Original-Pixeln der Textur (aus den Farbsprüngen gemessen)
  top: number;
  height: number;
  // Textur-Spalte, die in Ruhe am linken Button-Rand sitzt; der unterste Streifen ist nur rechts farbig
  startX: number;
};

const DEFAULT_START_X = 700;

// An den Streifen-Grenzen liegen helle Trennlinien und der Nachbarstreifen: oben und unten so viel abschneiden
// (Textur-Pixel), dass nur der eigene Streifen zu sehen ist – auch mit Glättung beim Skalieren
export const STRIPE_EDGE_TRIM = 2;

/** Sichtbarer Teil eines Streifens ohne die Ränder. */
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

// Nutzbarer Bereich der Textur in x: außerhalb sind die Streifen-Enden rund bzw. schwarz (mit Abstand, damit die
// Rundung nie sichtbar wird)
const TEXTURE_USABLE = {left: 300, right: 1700};
// Sichtbare Oberflächen-Bogenlänge vom linken Button-Rand bis zum Planetenrand (am Äquator, Sprite-Pixel)
const VISIBLE_ARC = 650;

/** Wie weit sich ein Streifen in jede Richtung drehen lässt, bis die Textur endet (Sprite-Pixel Oberfläche). */
export function rotationLimits(stripe: PlanetStripe): {min: number, max: number} {
  const scale = SPRITE_ROW.height / stripe.height;
  return {
    max: (stripe.startX - TEXTURE_USABLE.left) * scale,
    min: Math.min(0, (stripe.startX + VISIBLE_ARC / scale - TEXTURE_USABLE.right) * scale),
  };
}
