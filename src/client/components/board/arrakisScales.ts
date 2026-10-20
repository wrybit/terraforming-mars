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

/** Standard board: globs.less @oxygen-vals and @temperature-vals (−30 … +8 °C) */
export const STANDARD_SCALES: ScaleGeometry = {
  centreX: 300,
  centreY: 300.2,
  radius: 267.4,
  vegetationAngles: [127.3, 133.2, 139.9, 146.5, 152.5, 159, 165.3, 171.9, 178.3, 184.8, 191.1, 197.5, 203.9, 210.2, 216.5],
  waterAngles: [55.6, 50.3, 45.6, 40.6, 35.7, 30.6, 25.7, 20.6, 15.8, 10.8, 5.7, 0.8, -4.1, -9.3, -14.1, -19.2, -24.3, -29.3, -34.1, -39.4],
};

/** Large board: the first values of globs.less @oxygen-vals-large and @temperature-vals-large – the large Arrakis keeps
 *  the standard maximums (14 % vegetation, +8 °C), only Amazonis Planitia runs further */
export const LARGE_SCALES: ScaleGeometry = {
  centreX: 353,
  centreY: 351.2,
  radius: 313.9,
  vegetationAngles: [110, 116.1, 122, 128, 134, 140.1, 145.9, 152.1, 158, 164, 169.9, 176, 182, 188.1, 194],
  waterAngles: [70.1, 65.1, 60.2, 55.2, 50.4, 45.5, 40.5, 35.6, 30.6, 25.8, 20.9, 16, 11, 6.2, 1.2, -3.7, -8.6, -13.5, -18.4, -23.3],
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
    vegetation: {symbolAngle: vegetationEnd + 8.5, text: {from: vegetationEnd + 13.5, to: vegetationEnd + 45.5, anchor: 'start'}},
    water: {symbolAngle: waterEnd - 7.6, text: {from: waterEnd - 44.6, to: waterEnd - 12.6, anchor: 'end'}},
  };
}

export type ScaleStep = {path: string, index: number};

/** One sector per value, bounded halfway to its neighbours (the ends reach as far out as the first step is wide) */
export function scaleSteps(geometry: ScaleGeometry, angles: ReadonlyArray<number>): Array<ScaleStep> {
  const inner = geometry.radius - SCALE_BAND / 2;
  const outer = geometry.radius + SCALE_BAND / 2;
  return angles.map((angle, index) => {
    const before = index > 0 ? (angles[index - 1] + angle) / 2 : angle - (angles[1] - angle) / 2;
    const after = index < angles.length - 1 ? (angle + angles[index + 1]) / 2 : angle + (angle - angles[index - 1]) / 2;
    return {path: ringSector(geometry, before, after, inner, outer), index};
  });
}
