import {BONUS_ICON, TrackBonus} from '@/client/components/trackBonus/trackBonus';
import {ScaleGeometry} from './arrakisScales';
import {OXYGEN_LEVEL_FOR_AMAZONIS_CARD_BONUS, OXYGEN_LEVEL_FOR_AMAZONIS_TEMPERATURE_BONUS, TEMPERATURE_BONUS_FOR_PLANT} from '@/common/constants';
import {GlobalParameterMaximums, getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {BoardName} from '@/common/boards/BoardName';

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

// Tracks of Amazonis Planitia (server/boards/GlobalParameterTracks.ts): plants at −12 °C, a card at 7 % oxygen, the
// temperature step at 11 % instead of 8 %. Only the large Arrakis draws them as chips (Amazonis has them printed), so
// they take their place from its marker circle; Venus is not part of the Dune theme.
const AMAZONIS_SCALE_BONUSES: ReadonlyArray<ScaleBonus> = [
  ...SCALE_BONUSES.filter((entry) => entry.scale === 'temperature'),
  {scale: 'temperature', value: TEMPERATURE_BONUS_FOR_PLANT, cell: [0, 0], bonus: {icons: [BONUS_ICON.plant]}},
  {scale: 'oxygen', value: OXYGEN_LEVEL_FOR_AMAZONIS_CARD_BONUS, cell: [0, 0], bonus: {icons: [BONUS_ICON.card]}},
  {scale: 'oxygen', value: OXYGEN_LEVEL_FOR_AMAZONIS_TEMPERATURE_BONUS, cell: [0, 0], bonus: {icons: [BONUS_ICON.temperature]}},
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
  // The whole scale is at its top (the maximums of the board): Arrakis then drops the chip
  scaleComplete: boolean;
  // Tip of the connector (next to the cell) and the direction from there to the cell in degrees
  top: number;
  left: number;
  angle: number;
};

/** Centre of a scale cell: printed above for the standard circle; on the large Arrakis taken from its marker circle
 *  (the same rules, only the bigger dial of the large map, arrakisScales.ts LARGE_SCALES) */
function cellCentre(entry: ScaleBonus, geometry: ScaleGeometry | undefined): {x: number, y: number, planetX: number, planetY: number} {
  if (geometry === undefined || entry.scale === 'venus') {
    return {x: entry.cell[1] + CELL / 2, y: entry.cell[0] + CELL / 2, planetX: PLANET_CENTER[0], planetY: PLANET_CENTER[1]};
  }
  // Temperature runs from −30 °C in steps of 2, oxygen from 0 % in steps of 1
  const angle = entry.scale === 'temperature' ? geometry.waterAngles[(entry.value + 30) / 2] : geometry.vegetationAngles[entry.value];
  const radians = angle * Math.PI / 180;
  return {x: geometry.centreX + geometry.radius * Math.cos(radians), y: geometry.centreY + geometry.radius * Math.sin(radians),
    planetX: geometry.centreX, planetY: geometry.centreY};
}

/** amazonis: the board has the tracks of Amazonis Planitia (GlobalParameterMaximums.ts hasAmazonisTracks) */
export function scaleBonusPins(values: Partial<Record<MarsScale, number>>, geometry?: ScaleGeometry, amazonis: boolean = false,
  maximums: Readonly<GlobalParameterMaximums> = getGlobalParameterMaximums(BoardName.THARSIS)): Array<ScaleBonusPin> {
  const scaleMaximum: Readonly<Record<MarsScale, number>> = {temperature: maximums.temperature, oxygen: maximums.oxygen, venus: maximums.venus};
  return (amazonis ? AMAZONIS_SCALE_BONUSES : SCALE_BONUSES).filter((entry) => values[entry.scale] !== undefined).map((entry) => {
    const {x: centerX, y: centerY, planetX, planetY} = cellCentre(entry, geometry);
    const dx = centerX - planetX;
    const dy = centerY - planetY;
    const length = Math.hypot(dx, dy);
    const distance = CELL / 2 + GAP;
    return {
      key: entry.scale + entry.value,
      bonus: entry.bonus,
      done: (values[entry.scale] ?? 0) >= entry.value,
      scaleComplete: (values[entry.scale] ?? 0) >= scaleMaximum[entry.scale],
      top: centerY + dy / length * distance,
      left: centerX + dx / length * distance,
      angle: Math.atan2(-dy, -dx) * 180 / Math.PI,
    };
  });
}
