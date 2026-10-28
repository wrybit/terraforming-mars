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
 *  further up, so the spice row below the planet has room, both starting at the same height (Jens, 20 Oct 2026), and
 *  8° more so the symbols fit below the low ends (Jens, 28 Oct 2026) */
export const STANDARD_SCALES: ScaleGeometry = {
  centreX: 300,
  centreY: 300.2,
  radius: 267.4,
  vegetationAngles: [139.7, 145.6, 152.3, 158.9, 164.9, 171.4, 177.7, 184.3, 190.7, 197.2, 203.5, 209.9, 216.3, 222.6, 228.9],
  waterAngles: [40.6, 35.3, 30.6, 25.6, 20.7, 15.6, 10.7, 5.6, 0.8, -4.2, -9.3, -14.2, -19.1, -24.3, -29.1, -34.2, -39.3, -44.3, -49.1, -54.4],
};

/** Large board: globs.less @oxygen-vals-arrakis-91 and @temperature-vals-arrakis-91 – the large Arrakis has the
 *  tracks of Amazonis Planitia (18 % vegetation, +14 °C, common/boards/GlobalParameterMaximums.ts hasAmazonisTracks),
 *  on the same arcs as before: they start further out than on Amazonis Planitia, so the spice fields fit between their
 *  low ends (arrakisSpiceFields.ts), and reach as high as the labels allow, so the steps are shorter; turned up 7° so
 *  the symbols fit below the low ends (Jens, 28 Oct 2026) */
export const LARGE_SCALES: ScaleGeometry = {
  centreX: 353,
  centreY: 351.2,
  radius: 313.9,
  vegetationAngles: [133.5, 138.9, 144.3, 149.7, 155.1, 160.4, 165.8, 171.2, 176.6, 182, 187.4, 192.8, 198.2, 203.6, 208.9, 214.3, 219.7, 225.1, 230.5],
  waterAngles: [47, 42.6, 38.2, 33.8, 29.4, 25, 20.5, 16.1, 11.7, 7.3, 2.9, -1.5, -5.9, -10.3, -14.7, -19.1, -23.5, -28, -32.4, -36.8, -41.2, -45.6, -50],
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

// The name of each scale continues the band beyond its top end, on the same circle; the symbol sits beyond its low end,
// below the band (Jens, 28 Oct 2026: names stay at the top, symbols move to the bottom). Vegetation runs clockwise
// (upper left), the water storage counter-clockwise (upper right); the text always runs clockwise, so it stays upright.
// Measured in board pixels along the circle from the ends of the band, so the gaps are the same on both boards and on
// both sides.
export type ScaleLabel = {symbolAngle: number, text: {from: number, to: number, anchor: 'start' | 'end'}};

/** Distance from the low end of the band to the centre of the symbol */
export const LABEL_SYMBOL_DISTANCE = 31;
/** Distance from the top end of the band to the near end of the name */
export const LABEL_TEXT_DISTANCE = 12;
/** Length of the arc the name runs along (room for the longest translation) */
export const LABEL_TEXT_LENGTH = 150;

/** Angle where the band ends at its top: half a step beyond its last marker, like the outline (scaleOutline) */
function bandEnd(angles: ReadonlyArray<number>): number {
  const last = angles[angles.length - 1];
  return last + (last - angles[angles.length - 2]) / 2;
}

/** Angle where the band starts at its low end: half a step before its first marker */
function bandStart(angles: ReadonlyArray<number>): number {
  return angles[0] - (angles[1] - angles[0]) / 2;
}

function label(geometry: ScaleGeometry, angles: ReadonlyArray<number>, direction: 1 | -1): ScaleLabel {
  const degrees = (pixels: number) => direction * pixels / geometry.radius * 180 / Math.PI;
  const end = bandEnd(angles);
  const near = end + degrees(LABEL_TEXT_DISTANCE);
  const far = end + degrees(LABEL_TEXT_DISTANCE + LABEL_TEXT_LENGTH);
  return {
    symbolAngle: bandStart(angles) - degrees(LABEL_SYMBOL_DISTANCE),
    // The text runs clockwise: it starts at the band on the vegetation side and ends at the band on the water side
    text: direction === 1 ? {from: near, to: far, anchor: 'start'} : {from: far, to: near, anchor: 'end'},
  };
}

export function scaleLabels(geometry: ScaleGeometry): {vegetation: ScaleLabel, water: ScaleLabel} {
  return {
    vegetation: label(geometry, geometry.vegetationAngles, 1),
    water: label(geometry, geometry.waterAngles, -1),
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
