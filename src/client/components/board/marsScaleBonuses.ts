import {BONUS_ICON, TrackBonus} from '@/client/components/trackBonus/trackBonus';
import {ScaleGeometry} from './arrakisScales';
import {BoardName} from '@/common/boards/BoardName';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {getGlobalParameterTracks, GlobalParameterTrackBonus} from '@/common/boards/GlobalParameterTracks';

// Bonuses on the Mars scales as track chips outside the scale (mockup with-extensions), instead of the icons
// printed on the board picture (the board images in assets/board/ used here have none). Which bonus sits where
// comes from the same per-map data the server grants them from; the position from the rendered scale cell itself
// (globs.less places each cell by its margins), so the chips follow every dial, also the packed larger one.
// Arrakis turns its scales further and pins its markers on its own circle (arrakisScales.ts): there the position
// comes from that circle instead.
export type MarsScale = 'temperature' | 'oxygen' | 'venus';

// Top/left margin of a scale cell in .global-numbers coordinates, undefined if the cell is not there
export type CellPosition = readonly [number, number];
export type CellLookup = (scale: MarsScale, value: number) => CellPosition | undefined;

const BONUS_CHIPS: Record<GlobalParameterTrackBonus, TrackBonus> = {
  heatproduction: {icons: [BONUS_ICON.heat], production: true},
  plant: {icons: [BONUS_ICON.plant], production: true},
  ocean: {icons: [BONUS_ICON.ocean]},
  temperature: {icons: [BONUS_ICON.temperature]},
  drawcard: {icons: [BONUS_ICON.card]},
  colony: {icons: [BONUS_ICON.colony]},
  tr: {icons: [BONUS_ICON.tr]},
};

// Scale cell size (globs.less .global-numbers-value) and the dial centre in .global-numbers coordinates
// (contract with globs.less @dial-cx/@dial-cy and @dial-cx-large/@dial-cy-large), gap between connector end
// and cell edge (like the track chips elsewhere)
const CELL = 26;
const DIAL_CENTER = {standard: [300, 300], large: [353, 351]} as const;
const GAP = 3;

export type ScaleBonusPin = {
  key: string;
  bonus: TrackBonus;
  done: boolean;
  // The scale has reached its top (Arrakis then shows only its check)
  scaleComplete: boolean;
  // Tip of the connector (next to the cell) and the direction from there to the cell in degrees
  top: number;
  left: number;
  angle: number;
};

export type ScaleBonusOptions = {
  values: Partial<Record<MarsScale, number>>;
  boardName: BoardName;
  large: boolean;
  cell: CellLookup;
  // Arrakis: its markers sit on its own circle and angles (arrakisScales.ts); Venus is not part of the Dune theme
  geometry?: ScaleGeometry;
};

type CellCentre = {x: number, y: number, dialX: number, dialY: number};

function cellCentre(options: ScaleBonusOptions, scale: MarsScale, value: number): CellCentre | undefined {
  const geometry = options.geometry;
  if (geometry !== undefined && scale !== 'venus') {
    // Temperature runs from −30 °C in steps of 2, oxygen from 0 % in steps of 1
    const angle = scale === 'temperature' ? geometry.waterAngles[(value + 30) / 2] : geometry.vegetationAngles[value];
    if (angle === undefined) {
      return undefined;
    }
    const radians = angle * Math.PI / 180;
    return {x: geometry.centreX + geometry.radius * Math.cos(radians), y: geometry.centreY + geometry.radius * Math.sin(radians),
      dialX: geometry.centreX, dialY: geometry.centreY};
  }
  const position = options.cell(scale, value);
  if (position === undefined) {
    return undefined;
  }
  const center = options.large ? DIAL_CENTER.large : DIAL_CENTER.standard;
  return {x: position[1] + CELL / 2, y: position[0] + CELL / 2, dialX: center[0], dialY: center[1]};
}

export function scaleBonusPins(options: ScaleBonusOptions): Array<ScaleBonusPin> {
  const tracks = getGlobalParameterTracks(options.boardName);
  const maximums = getGlobalParameterMaximums(options.boardName);
  const scales: ReadonlyArray<MarsScale> = ['temperature', 'oxygen', 'venus'];
  const pins: Array<ScaleBonusPin> = [];
  for (const scale of scales) {
    const current = options.values[scale];
    if (current === undefined) {
      continue;
    }
    for (const threshold of tracks[scale]) {
      const centre = cellCentre(options, scale, threshold.value);
      if (centre === undefined) {
        continue;
      }
      const dx = centre.x - centre.dialX;
      const dy = centre.y - centre.dialY;
      const length = Math.hypot(dx, dy);
      const distance = CELL / 2 + GAP;
      pins.push({
        key: scale + threshold.value,
        bonus: BONUS_CHIPS[threshold.bonus],
        done: current >= threshold.value,
        scaleComplete: current >= maximums[scale],
        top: centre.y + dy / length * distance,
        left: centre.x + dx / length * distance,
        angle: Math.atan2(-dy, -dx) * 180 / Math.PI,
      });
    }
  }
  return pins;
}
