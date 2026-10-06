// Moon rates as curved tracks around the Moon – like temperature, oxygen and Venus around Mars.
// The board becomes a square (RING_BOARD_SIZE) with the Moon in the middle. All original positions of the moon spaces
// (moon.less) stay valid: the board content is only moved by RING_OFFSET.
import {TrackBonus, BONUS_ICON} from '@/client/components/trackBonus/trackBonus';

export type MoonRate = 'habitat' | 'logistic' | 'mining';

export const RING_BOARD_SIZE = 492;
// Centre of the moon disc in the original board (moon.less layout) and its radius as drawn
const ORIGINAL_CENTER = [242.5, 170.5] as const;
export const DISC_RADIUS = 176;
export const RING_OFFSET = [
  Math.max(0, RING_BOARD_SIZE / 2 - ORIGINAL_CENTER[0]),
  Math.max(0, RING_BOARD_SIZE / 2 - ORIGINAL_CENTER[1]),
] as const;
export const RING_CENTER = [ORIGINAL_CENTER[0] + RING_OFFSET[0], ORIGINAL_CENTER[1] + RING_OFFSET[1]] as const;
// Radius of the track band's centre line and its width
const RING_RADIUS = DISC_RADIUS + 24;
const BAND_WIDTH = 30;
const STEPS = 8;
// Gap between band edge and bonus connector, connector length (as track_bonus.less)
const BONUS_GAP = 3;

type Arc = {from: number, to: number, colors: readonly [string, string], icon: string};

// Angles in degrees (0° = right, 90° = down) from value 0 to value 8; a gap stays at the bottom for the track icons
const ARCS: Record<MoonRate, Arc> = {
  habitat: {from: 122, to: 206, colors: ['#2a8db0', '#93def3'], icon: 'moon/play-habitattile.png'},
  logistic: {from: 234, to: 318, colors: ['#858c95', '#e3e6ea'], icon: 'moon/play-roadtile.png'},
  mining: {from: 58, to: -26, colors: ['#87532b', '#d6a066'], icon: 'moon/play-minetile.png'},
};

export const MOON_RATES: ReadonlyArray<MoonRate> = ['habitat', 'logistic', 'mining'];

// Bonuses from the game code (MoonExpansion.raiseRate): a card at 3, one production at 6
const BONUS_PRODUCTION: Record<MoonRate, string> = {
  habitat: BONUS_ICON.energy,
  logistic: BONUS_ICON.steel,
  mining: BONUS_ICON.titanium,
};
export function moonRateBonuses(rate: MoonRate): Record<number, TrackBonus> {
  return {
    3: {icons: [BONUS_ICON.card]},
    6: {icons: [BONUS_PRODUCTION[rate]], production: true},
  };
}

function point(degrees: number, radius: number): [number, number] {
  const radians = degrees * Math.PI / 180;
  return [RING_CENTER[0] + radius * Math.cos(radians), RING_CENTER[1] + radius * Math.sin(radians)];
}

function mix(a: string, b: string, share: number): string {
  return '#' + [1, 3, 5].map((index) => {
    const value = Math.round(parseInt(a.slice(index, index + 2), 16) * (1 - share) + parseInt(b.slice(index, index + 2), 16) * share);
    return value.toString(16).padStart(2, '0');
  }).join('');
}

// Ring segment (area of a circular arc) between two angles
function segment(from: number, to: number, inner: number, outer: number): string {
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  const sweep = to > from ? 1 : 0;
  const [x1, y1] = point(from, outer);
  const [x2, y2] = point(to, outer);
  const [x3, y3] = point(to, inner);
  const [x4, y4] = point(from, inner);
  return `M${x1} ${y1} A${outer} ${outer} 0 ${large} ${sweep} ${x2} ${y2} L${x3} ${y3} A${inner} ${inner} 0 ${large} ${1 - sweep} ${x4} ${y4} Z`;
}

export function angleOf(rate: MoonRate, value: number): number {
  const arc = ARCS[rate];
  return arc.from + (arc.to - arc.from) * value / STEPS;
}

export type RingBand = {
  rate: MoonRate;
  cells: Array<{path: string, fill: string}>;
  lines: Array<{x1: number, y1: number, x2: number, y2: number}>;
  slot: {path: string, fill: string};
  icon: {href: string, x: number, y: number};
  outline: string;
};

// Band of one rate: cells without gaps, separated by thin light lines, getting lighter towards the high end
// (like the Mars scales), plus a darker field with the track icon in front of the 0
export function ringBand(rate: MoonRate): RingBand {
  const arc = ARCS[rate];
  const step = (arc.to - arc.from) / STEPS;
  const inner = RING_RADIUS - BAND_WIDTH / 2;
  const outer = RING_RADIUS + BAND_WIDTH / 2;
  const cells = Array.from({length: STEPS + 1}, (_, index) => {
    const angle = arc.from + step * index;
    return {path: segment(angle - step / 2, angle + step / 2, inner, outer), fill: mix(arc.colors[0], arc.colors[1], index / STEPS)};
  });
  const lines = Array.from({length: STEPS + 1}, (_, index) => {
    const angle = arc.from + step * (index - 0.5);
    const [x1, y1] = point(angle, inner);
    const [x2, y2] = point(angle, outer);
    return {x1, y1, x2, y2};
  });
  const slotStart = arc.from - step / 2 - step * 1.3;
  const [iconX, iconY] = point(arc.from - step * 1.15, RING_RADIUS);
  return {
    rate,
    cells,
    lines,
    slot: {path: segment(slotStart, arc.from - step / 2, inner, outer), fill: mix(arc.colors[0], '#000000', 0.45)},
    icon: {href: 'assets/' + arc.icon, x: iconX - 13, y: iconY - 13},
    outline: segment(slotStart, arc.to + step / 2, inner, outer),
  };
}

// Number on the track: always upright; only the frame of the active value follows the curve (across the track).
// The frame is point-symmetric, so its rotation stays within ±90° and the number is never upside down.
export function ringCell(rate: MoonRate, value: number): {left: number, top: number, turn: number} {
  const angle = angleOf(rate, value);
  const [left, top] = point(angle, RING_RADIUS);
  let turn = (((angle + 90) % 180) + 180) % 180;
  if (turn > 90) {
    turn -= 180;
  }
  return {left, top, turn};
}

// Bonus pin radially outside the band: anchored at the connector's tip, turned so the connector points to the centre
export function ringBonusAnchor(rate: MoonRate, value: number): {left: number, top: number, angle: number} {
  const angle = angleOf(rate, value);
  const [left, top] = point(angle, RING_RADIUS + BAND_WIDTH / 2 + BONUS_GAP);
  return {left, top, angle};
}
