// Look of the Arrakis scales, design "E6 · Oase+" (Jens, 20 Oct 2026, mockup _outputs/dune-skalen-designs.html):
// the whole path faintly drawn in its gradient, the fill moved outwards so the numbers keep a free strip inside,
// particles flowing from the sand to the value, the value as a glowing capsule on the arc. A full scale fills the whole
// band, drops numbers and steps and shows only a check in its middle. All sizes in board px (mockup px / 1.386).
import {ScaleGeometry, SCALE_BAND, pointAt} from './arrakisScales';
import {Particle, particles} from './arrakisMotion';

export type ScaleKey = 'vegetation' | 'water';

/** Current value of a scale: index from the lowest value, and the text of every value from the lowest up */
export type ScaleValues = {level: number, labels: ReadonlyArray<string>};

/** Light tone per band: edges, glow and the white-to-colour particles */
export const SCALE_GLOW: Readonly<Record<ScaleKey, string>> = {vegetation: '#8dff8f', water: '#7fd0ff'};

const HALF_BAND = SCALE_BAND / 2;
/** Fill: outwards by this much and this wide, so the numbers inside stay free (Jens: "nicht unter dem Graph") */
export const FILL_OFFSET = 4.3;
export const FILL_WIDTH = 11.5;
/** Faint gradient of the whole path behind the fill (the background of design E3) */
export const GHOST_WIDTH = 29.1;
export const GHOST_OPACITY = 0.16;
/** Numbers inside, step dots outside */
export const NUMBER_INSET = 10.2;
export const DOT_INSET = 2.2;
/** A full band: fill nearly the band width */
export const FULL_WIDTH = SCALE_BAND - 1.4;
// Arc pieces of the gradient: short enough that the steps between their colours do not show
const GRADIENT_STEP_DEGREES = 1.2;

/** Bounds of the band: halfway beyond the first and the last marker, like the steps (scaleSteps) */
export function bandBounds(angles: ReadonlyArray<number>): {from: number, to: number} {
  const first = angles[0];
  const last = angles[angles.length - 1];
  return {from: first - (angles[1] - first) / 2, to: last + (last - angles[angles.length - 2]) / 2};
}

/** Open arc in drawing direction from `from` to `to` (either way round) on a radius */
export function openArc(geometry: ScaleGeometry, from: number, to: number, radius: number): string {
  const start = pointAt(geometry, from, radius);
  const end = pointAt(geometry, to, radius);
  const sweep = to > from ? 1 : 0;
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${large} ${sweep} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

export type GradientPiece = {path: string, share: number};

/**
 * The gradient along the band as short arc pieces, each in the colour of its place on the whole band (share 0 at the
 * sand end, 1 at the top): a half-full scale is still sandy, green or blue only at the top. Pieces overlap a little,
 * so no seams show between them.
 */
export function gradientPieces(geometry: ScaleGeometry, angles: ReadonlyArray<number>, toAngle: number, radius: number): Array<GradientPiece> {
  const {from, to} = bandBounds(angles);
  const total = to - from;
  const span = toAngle - from;
  const count = Math.max(2, Math.ceil(Math.abs(span) / GRADIENT_STEP_DEGREES));
  const pieces: Array<GradientPiece> = [];
  for (let index = 0; index < count; index++) {
    const start = from + span * index / count;
    const end = from + span * Math.min(1, (index + 1.15) / count);
    const share = Math.min(1, Math.max(0, ((start + end) / 2 - from) / total));
    pieces.push({path: openArc(geometry, start, end, radius), share});
  }
  return pieces;
}

/** Marker text on the arc: upright on both sides, its top towards the outside */
export function tangentRotation(angle: number): number {
  const normalised = ((angle % 360) + 360) % 360;
  return normalised > 90 && normalised < 270 ? angle - 180 : angle;
}

export type ScaleNumber = {x: number, y: number, rotation: number, text: string, reached: boolean};
export type ScaleDot = {x: number, y: number, reached: boolean};
export type ScaleCapsule = {x: number, y: number, rotation: number, text: string, share: number};
export type FlowPath = {path: string, particle: Particle};

export type ScaleArt = {
  full: boolean,
  ghost: Array<GradientPiece>,
  fill: Array<GradientPiece>,
  numbers: Array<ScaleNumber>,
  dots: Array<ScaleDot>,
  capsule: ScaleCapsule | undefined,
  flow: Array<FlowPath>,
  /** Full band only: the whole arc (halo, shine) and its edges, and the check in its middle */
  band: string,
  innerEdge: string,
  outerEdge: string,
  check: {x: number, y: number} | undefined,
};

// Seeds per band and state, as in the mockup: the particles there are the particles here
const SEEDS: Readonly<Record<ScaleKey, {partial: number, full: number}>> = {vegetation: {partial: 7, full: 21}, water: {partial: 13, full: 29}};

/**
 * Everything one band draws for a value. `level`: index of the current value (0 = lowest), `labels`: the text of every
 * value from the lowest up (the same as the markers of Board.vue).
 */
export function scaleArt(geometry: ScaleGeometry, key: ScaleKey, angles: ReadonlyArray<number>, level: number, labels: ReadonlyArray<string>): ScaleArt {
  const top = angles.length - 1;
  const current = Math.min(Math.max(level, 0), top);
  const full = current === top;
  const {from, to} = bandBounds(angles);
  const radius = geometry.radius;
  const art: ScaleArt = {
    full,
    ghost: [],
    fill: [],
    numbers: [],
    dots: [],
    capsule: undefined,
    flow: [],
    band: openArc(geometry, from, to, radius),
    innerEdge: openArc(geometry, from, to, radius - HALF_BAND),
    outerEdge: openArc(geometry, from, to, radius + HALF_BAND),
    check: undefined,
  };
  if (full) {
    // Loaded: the whole band in its gradient, particles across its full width, the check in the middle of the arc
    art.fill = gradientPieces(geometry, angles, to, radius);
    art.flow = particles(SEEDS[key].full, {count: 46, spread: SCALE_BAND - 4.3, minRadius: 0.65, radiusRange: 1.73,
      minTravel: 2.2, travelRange: 3.4, minBlink: 0.7, blinkRange: 1.6, maxColourShare: 0.9})
      .map((particle) => ({path: openArc(geometry, from, to, radius + particle.offset), particle}));
    art.check = pointAt(geometry, (from + to) / 2, radius);
    return art;
  }
  art.ghost = gradientPieces(geometry, angles, to, radius);
  angles.forEach((angle, index) => {
    const dot = pointAt(geometry, angle, radius + HALF_BAND - DOT_INSET);
    art.dots.push({x: dot.x, y: dot.y, reached: index <= current});
    // Every second value as a number, the current one sits in the capsule
    if (index % 2 === 0 && index !== current) {
      const at = pointAt(geometry, angle, radius - HALF_BAND + NUMBER_INSET);
      art.numbers.push({x: at.x, y: at.y, rotation: tangentRotation(angle), text: labels[index] ?? '', reached: index <= current});
    }
  });
  const fillRadius = radius + FILL_OFFSET;
  if (current > 0) {
    art.fill = gradientPieces(geometry, angles, angles[current], fillRadius);
    art.flow = particles(SEEDS[key].partial, {count: 10 + current * 2, spread: FILL_WIDTH - 2.2, minRadius: 0.65, radiusRange: 1.73,
      minTravel: 2.2, travelRange: 3.4, minBlink: 0.7, blinkRange: 1.6, maxColourShare: 0.9})
      .map((particle) => ({path: openArc(geometry, from, angles[current], fillRadius + particle.offset), particle}));
  }
  const capsuleAt = pointAt(geometry, angles[current], radius);
  art.capsule = {x: capsuleAt.x, y: capsuleAt.y, rotation: tangentRotation(angles[current]), text: labels[current] ?? '', share: current / top};
  return art;
}
