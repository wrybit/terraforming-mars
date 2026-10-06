import {BONUS_ICON, TrackBonus} from '@/client/components/trackBonus/trackBonus';

// Bonuses on the Mars scales as track chips outside the scale (mockup with-extensions), instead of the icons
// printed on the board picture (assets/board/mars-clean.png has none). Positions in the coordinates of
// .global-numbers: the scale cells sit at these margins (contract with globs.less: @temperature-vals etc.).
export type MarsScale = 'temperature' | 'oxygen' | 'venus';

type ScaleBonus = {scale: MarsScale, value: number, cell: readonly [number, number], bonus: TrackBonus};

// Game rules (common/constants.ts): heat production at −24 and −20 °C, an ocean at 0 °C,
// +1 temperature at 8 % oxygen, a card at 8 % Venus and TR at 16 % Venus
const SCALE_BONUSES: ReadonlyArray<ScaleBonus> = [
  {scale: 'temperature', value: -24, cell: [461, 490], bonus: {icons: [BONUS_ICON.heat], production: true}},
  {scale: 'temperature', value: -20, cell: [423, 517], bonus: {icons: [BONUS_ICON.heat], production: true}},
  {scale: 'temperature', value: 0, cell: [199, 540], bonus: {icons: [BONUS_ICON.ocean]}},
  {scale: 'oxygen', value: 8, cell: [295, 20], bonus: {icons: [BONUS_ICON.temperature]}},
  {scale: 'venus', value: 8, cell: [36, 197], bonus: {icons: [BONUS_ICON.card]}},
  {scale: 'venus', value: 16, cell: [20, 301], bonus: {icons: [BONUS_ICON.tr]}},
];

// Scale cell size (globs.less .global-numbers-value), planet centre in .global-numbers coordinates,
// gap between connector end and cell edge (like the track chips elsewhere)
const CELL = 26;
const PLANET_CENTER = [298, 294] as const;
const GAP = 3;

export type ScaleBonusPin = {
  key: string;
  bonus: TrackBonus;
  done: boolean;
  // Tip of the connector (next to the cell) and the direction from there to the cell in degrees
  top: number;
  left: number;
  angle: number;
};

export function scaleBonusPins(values: Partial<Record<MarsScale, number>>): Array<ScaleBonusPin> {
  return SCALE_BONUSES.filter((entry) => values[entry.scale] !== undefined).map((entry) => {
    const centerX = entry.cell[1] + CELL / 2;
    const centerY = entry.cell[0] + CELL / 2;
    const dx = centerX - PLANET_CENTER[0];
    const dy = centerY - PLANET_CENTER[1];
    const length = Math.hypot(dx, dy);
    const distance = CELL / 2 + GAP;
    return {
      key: entry.scale + entry.value,
      bonus: entry.bonus,
      done: (values[entry.scale] ?? 0) >= entry.value,
      top: centerY + dy / length * distance,
      left: centerX + dx / length * distance,
      angle: Math.atan2(-dy, -dx) * 180 / Math.PI,
    };
  });
}
