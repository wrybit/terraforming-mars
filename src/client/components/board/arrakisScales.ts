// The two scales around Arrakis (vegetation left, water storage right) drawn as vectors instead of the Mars rings
// of the board picture: the picture got blurry once its rings were recoloured and cut out. The markers with the numbers
// stay where globs.less pins them; these arcs only lie behind them, on the same circle. The large Arrakis pins its
// markers on the bigger circle of the large map (globs.less .global-numbers--large), so it has a geometry of its own.

export type ScaleGeometry = {
  /** Circle of the markers in the coordinates of .global-numbers (globs.less @dial-cx, @dial-cy, @dial-r) */
  centreX: number,
  centreY: number,
  radius: number,
  /** Angle of every marker in degrees (clockwise from the right), in order of the values */
  vegetationAngles: ReadonlyArray<number>,
  waterAngles: ReadonlyArray<number>,
};

/** Standard board: globs.less @oxygen-vals-arrakis and @temperature-vals-arrakis (−30 … +8 °C): the Mars arcs turned
 *  further up, so the spice row below the planet has room, both starting at the same height (Jens, 20 Oct 2026) */
export const STANDARD_SCALES: ScaleGeometry = {
  centreX: 300,
  centreY: 300.2,
  radius: 267.4,
  vegetationAngles: [131.7, 137.6, 144.3, 150.9, 156.9, 163.4, 169.7, 176.3, 182.7, 189.2, 195.5, 201.9, 208.3, 214.6, 220.9],
  waterAngles: [48.6, 43.3, 38.6, 33.6, 28.7, 23.6, 18.7, 13.6, 8.8, 3.8, -1.3, -6.2, -11.1, -16.3, -21.1, -26.2, -31.3, -36.3, -41.1, -46.4],
};

/** Large board: globs.less @oxygen-vals-arrakis-91 and @temperature-vals-arrakis-91 – the large Arrakis has the
 *  tracks of Amazonis Planitia (18 % vegetation, +14 °C, common/boards/GlobalParameterMaximums.ts hasAmazonisTracks),
 *  on the same arcs as before: they start further out than on Amazonis Planitia, so the spice fields fit between their
 *  low ends (arrakisSpiceFields.ts), and reach as high as the labels allow, so the steps are shorter */
export const LARGE_SCALES: ScaleGeometry = {
  centreX: 353,
  centreY: 351.2,
  radius: 313.9,
  vegetationAngles: [126.5, 131.9, 137.3, 142.7, 148.1, 153.4, 158.8, 164.2, 169.6, 175, 180.4, 185.8, 191.2, 196.6, 201.9, 207.3, 212.7, 218.1, 223.5],
  waterAngles: [54, 49.6, 45.2, 40.8, 36.4, 32, 27.5, 23.1, 18.7, 14.3, 9.9, 5.5, 1.1, -3.3, -7.7, -12.1, -16.5, -21, -25.4, -29.8, -34.2, -38.6, -43],
};

/** Width of the band; the 26px markers sit inside it */
export const SCALE_BAND = 32;

function point(geometry: ScaleGeometry, angle: number, radius: number): string {
  const {x, y} = pointAt(geometry, angle, radius);
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

/** Ring sector between two angles (any order) as an SVG path */
export function ringSector(geometry: ScaleGeometry, from: number, to: number, inner: number, outer: number): string {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${point(geometry, start, outer)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${point(geometry, end, outer)}`,
    `L ${point(geometry, end, inner)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${point(geometry, start, inner)}`,
    'Z',
  ].join(' ');
}

/** Arc of the circle as an open SVG path, drawn clockwise from `from` to `to` (for text along the scale) */
export function arcPath(geometry: ScaleGeometry, from: number, to: number): string {
  const large = to - from > 180 ? 1 : 0;
  return `M ${point(geometry, from, geometry.radius)} A ${geometry.radius} ${geometry.radius} 0 ${large} 1 ${point(geometry, to, geometry.radius)}`;
}

/** Point on the circle at an angle (the marker circle unless another radius is given) */
export function pointAt(geometry: ScaleGeometry, angle: number, radius: number = geometry.radius): {x: number, y: number} {
  const radians = angle * Math.PI / 180;
  return {x: geometry.centreX + radius * Math.cos(radians), y: geometry.centreY + radius * Math.sin(radians)};
}

// Symbol and name of each scale continue the band beyond its top end, on the same circle: vegetation goes on clockwise
// (upper left), the water storage counter-clockwise (upper right); the text always runs clockwise, so it stays upright.
// Measured from the last marker of the scale, so they follow the band on both boards.
export type ScaleLabel = {symbolAngle: number, text: {from: number, to: number, anchor: 'start' | 'end'}};

export function scaleLabels(geometry: ScaleGeometry): {vegetation: ScaleLabel, water: ScaleLabel} {
  const vegetationEnd = geometry.vegetationAngles[geometry.vegetationAngles.length - 1];
  const waterEnd = geometry.waterAngles[geometry.waterAngles.length - 1];
  return {
    vegetation: {symbolAngle: vegetationEnd + 9.5, text: {from: vegetationEnd + 16, to: vegetationEnd + 47.6, anchor: 'start'}},
    water: {symbolAngle: waterEnd - 8.6, text: {from: waterEnd - 45.5, to: waterEnd - 15.1, anchor: 'end'}},
  };
}

/** share: 0 at the lowest value, 1 at the top – the band runs through its colours along it (scaleColour) */
export type ScaleStep = {path: string, index: number, share: number};

/** One sector per value, bounded halfway to its neighbours (the ends reach as far out as the first step is wide) */
export function scaleSteps(geometry: ScaleGeometry, angles: ReadonlyArray<number>): Array<ScaleStep> {
  const inner = geometry.radius - SCALE_BAND / 2;
  const outer = geometry.radius + SCALE_BAND / 2;
  return angles.map((angle, index) => {
    const before = index > 0 ? (angles[index - 1] + angle) / 2 : angle - (angles[1] - angle) / 2;
    const after = index < angles.length - 1 ? (angle + angles[index + 1]) / 2 : angle + (angle - angles[index - 1]) / 2;
    return {path: ringSector(geometry, before, after, inner, outer), index, share: angles.length > 1 ? index / (angles.length - 1) : 0};
  });
}

/** The whole band as one sector, for the white outline around it (like the scales of the Mars board) */
export function scaleOutline(geometry: ScaleGeometry, angles: ReadonlyArray<number>): string {
  const first = angles[0];
  const last = angles[angles.length - 1];
  const from = first - (angles[1] - first) / 2;
  const to = last + (last - angles[angles.length - 2]) / 2;
  return ringSector(geometry, Math.min(from, to), Math.max(from, to), geometry.radius - SCALE_BAND / 2, geometry.radius + SCALE_BAND / 2);
}

/**
 * Colour of a step: a gradient from the low to the high end instead of alternating shades (Jens, 20 Oct 2026). Both
 * bands start in the sand of the planet and turn into what the parameter makes of it: vegetation green, water blue.
 */
const ARRAKIS_SAND = '#d39a5c';
export const SCALE_COLOURS: Readonly<Record<'vegetation' | 'water', readonly [string, string]>> = {
  vegetation: [ARRAKIS_SAND, '#2f8a2c'],
  water: [ARRAKIS_SAND, '#1d5fae'],
};

// Mixed in OKLab: from sand to blue a plain RGB mix passes through grey, OKLab keeps the middle steps clear
export function scaleColour(track: 'vegetation' | 'water', share: number): string {
  const [low, high] = SCALE_COLOURS[track];
  return `color-mix(in oklab, ${high} ${Math.round(share * 100)}%, ${low})`;
}
