// The two scales around Arrakis (vegetation left, water storage right) drawn as vectors instead of the Mars rings
// of the board picture: the picture got blurry once its rings were recoloured and cut out. The markers with the numbers
// stay where globs.less pins them; these arcs only lie behind them, on the same circle.

/** Circle of the markers in the coordinates of .global-numbers (globs.less @dial-cx, @dial-cy, @dial-r) */
export const SCALE_CENTRE_X = 300;
export const SCALE_CENTRE_Y = 300.2;
export const SCALE_RADIUS = 267.4;
/** Width of the band; the 26px markers sit inside it */
export const SCALE_BAND = 32;

/** Angle of every marker in degrees (clockwise from the right), in order of the values (globs.less @oxygen-vals) */
export const VEGETATION_ANGLES: ReadonlyArray<number> = [
  127.3, 133.2, 139.9, 146.5, 152.5, 159, 165.3, 171.9, 178.3, 184.8, 191.1, 197.5, 203.9, 210.2, 216.5,
];

/** Same for the water storage (globs.less @temperature-vals, −30 … +8 °C) */
export const WATER_ANGLES: ReadonlyArray<number> = [
  55.6, 50.3, 45.6, 40.6, 35.7, 30.6, 25.7, 20.6, 15.8, 10.8, 5.7, 0.8, -4.1, -9.3, -14.1, -19.2, -24.3, -29.3, -34.1, -39.4,
];

function point(angle: number, radius: number): string {
  const radians = angle * Math.PI / 180;
  const x = SCALE_CENTRE_X + radius * Math.cos(radians);
  const y = SCALE_CENTRE_Y + radius * Math.sin(radians);
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

/** Ring sector between two angles (any order) as an SVG path */
export function ringSector(from: number, to: number, inner: number, outer: number): string {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${point(start, outer)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${point(end, outer)}`,
    `L ${point(end, inner)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${point(start, inner)}`,
    'Z',
  ].join(' ');
}

/** Arc of the circle as an open SVG path, drawn clockwise from `from` to `to` (for text along the scale) */
export function arcPath(from: number, to: number, radius: number): string {
  const large = to - from > 180 ? 1 : 0;
  return `M ${point(from, radius)} A ${radius} ${radius} 0 ${large} 1 ${point(to, radius)}`;
}

/** Centre of a symbol on the circle at an angle */
export function pointAt(angle: number, radius: number = SCALE_RADIUS): {x: number, y: number} {
  const radians = angle * Math.PI / 180;
  return {x: SCALE_CENTRE_X + radius * Math.cos(radians), y: SCALE_CENTRE_Y + radius * Math.sin(radians)};
}

// Symbol and name of each scale continue the band beyond its top end, on the same circle:
// vegetation goes on clockwise (upper left), the water storage counter-clockwise (upper right); the text always
// runs clockwise, so it stays upright
export const SCALE_LABELS = {
  vegetation: {symbolAngle: 225, text: {from: 230, to: 262, anchor: 'start'}},
  water: {symbolAngle: -47, text: {from: -84, to: -52, anchor: 'end'}},
} as const;

export type ScaleStep = {path: string, index: number};

/** One sector per value, bounded halfway to its neighbours (the ends reach as far out as the first step is wide) */
export function scaleSteps(angles: ReadonlyArray<number>): Array<ScaleStep> {
  const inner = SCALE_RADIUS - SCALE_BAND / 2;
  const outer = SCALE_RADIUS + SCALE_BAND / 2;
  return angles.map((angle, index) => {
    const before = index > 0 ? (angles[index - 1] + angle) / 2 : angle - (angles[1] - angle) / 2;
    const after = index < angles.length - 1 ? (angle + angles[index + 1]) / 2 : angle + (angle - angles[index - 1]) / 2;
    return {path: ringSector(before, after, inner, outer), index};
  });
}
