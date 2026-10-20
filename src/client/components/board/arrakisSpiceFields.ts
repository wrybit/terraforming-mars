// Spice fields below Arrakis (ArrakisSpiceFields.vue), design E6 · Oase+ (Jens, 20 Oct 2026): one honeycomb cell per
// field on a flat arc under the planet, filled ones glowing orange; when all are placed they merge into one loaded bar
// with particles flowing through and a check in a hexagon. All sizes in board px (mockup px / 1.386).
import {LARGE_SCALES, STANDARD_SCALES, ScaleGeometry} from './arrakisScales';

export const CELL_WIDTH = 17.32;
export const CELL_GAP = 2.89;
export const ICON_SIZE = 23.09;
export const GROUP_GAP = 6.49;
// As wide as the tile on the other side (the count "6/9" is about that wide): the gaps to both scales look the same
export const COUNT_WIDTH = ICON_SIZE;
export const BAR_HEIGHT = 17.32;
export const CHECK_HEX = 21.65;

/** Arc of the row (coordinates of .global-numbers): `apexY` is its lowest point below the centre, `scale` its size */
export type SpiceRow = {centreX: number, apexY: number, arcRadius: number, scale: number};

/**
 * Standard board: a flat arc just below the planet, where the count was – flatter than the planet circle, so it does
 * not run into the low ends of the scales. The large board ends its section right below the planet: the row hugs the
 * planet on the circle of the scales, in the gap between their low ends (globs.less @oxygen-vals-arrakis-large starts
 * the scales far enough out for it, Jens 20 Oct 2026).
 */
export function spiceRow(large: boolean): SpiceRow {
  const geometry: ScaleGeometry = large ? LARGE_SCALES : STANDARD_SCALES;
  if (large) {
    return {centreX: geometry.centreX, apexY: geometry.centreY + 308, arcRadius: 308, scale: 1};
  }
  return {centreX: geometry.centreX, apexY: geometry.centreY + 252.7, arcRadius: 404.1, scale: 1};
}

export type SpiceLayout = {
  /** Distances from the centre of the row along it (board px, negative = left) */
  icon: number,
  cells: Array<number>,
  cellsLeft: number,
  cellsRight: number,
  count: number,
  check: number,
};

/** Places along the row as distances from its middle, for a row of the given size */
export function spiceLayout(fields: number, scale = 1): SpiceLayout {
  const cell = CELL_WIDTH * scale;
  const gap = CELL_GAP * scale;
  const icon = ICON_SIZE * scale;
  const groupGap = GROUP_GAP * scale;
  const countWidth = COUNT_WIDTH * scale;
  const cellsWidth = fields * cell + Math.max(0, fields - 1) * gap;
  const left = -(icon + groupGap + cellsWidth + groupGap + countWidth) / 2;
  const cellsLeft = left + icon + groupGap;
  const cellsRight = cellsLeft + cellsWidth;
  const cells = Array.from({length: fields}, (_, index) => cellsLeft + cell / 2 + index * (cell + gap));
  return {icon: left + icon / 2, cells, cellsLeft, cellsRight, count: cellsRight + groupGap + countWidth / 2, check: cellsRight + groupGap + CHECK_HEX * scale / 2};
}

/** Angle on the spice arc for a distance from the middle of the row (90° = straight below its centre) */
export function spiceAngle(row: SpiceRow, distance: number): number {
  return 90 - distance / row.arcRadius * 180 / Math.PI;
}

/** Point on the spice arc, `lift` towards its centre (negative) or away from it */
export function spicePoint(row: SpiceRow, distance: number, lift = 0): {x: number, y: number} {
  const radians = spiceAngle(row, distance) * Math.PI / 180;
  const radius = row.arcRadius + lift;
  const centreY = row.apexY - row.arcRadius;
  return {x: row.centreX + radius * Math.cos(radians), y: centreY + radius * Math.sin(radians)};
}

/** Arc from left to right, so text and particles run in reading direction */
export function spiceArc(row: SpiceRow, from: number, to: number, lift = 0): string {
  const start = spicePoint(row, from, lift);
  const end = spicePoint(row, to, lift);
  const radius = row.arcRadius + lift;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 0 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/** Transform that puts an element drawn around 0/0 at full size onto the arc, along its tangent, at the row's size */
export function onSpiceArc(row: SpiceRow, distance: number): string {
  const at = spicePoint(row, distance);
  const scale = row.scale === 1 ? '' : ` scale(${row.scale})`;
  return `translate(${at.x.toFixed(2)} ${at.y.toFixed(2)}) rotate(${(spiceAngle(row, distance) - 90).toFixed(2)})${scale}`;
}

/** Hexagon with the tip on top around 0/0 (the spice field tiles stand on a side like this) */
export function hexagon(width: number): string {
  const half = width / Math.sqrt(3);
  const x = width / 2;
  return `M 0 ${(-half).toFixed(2)} L ${x.toFixed(2)} ${(-half / 2).toFixed(2)} L ${x.toFixed(2)} ${(half / 2).toFixed(2)} ` +
    `L 0 ${half.toFixed(2)} L ${(-x).toFixed(2)} ${(half / 2).toFixed(2)} L ${(-x).toFixed(2)} ${(-half / 2).toFixed(2)} Z`;
}

/** Bounding box of the row in .global-numbers coordinates: the change flash of the spice fields rings around it */
export function spiceRowBox(large: boolean, fields: number): {left: number, top: number, width: number, height: number} {
  const row = spiceRow(large);
  const layout = spiceLayout(fields, row.scale);
  const width = layout.count + COUNT_WIDTH * row.scale / 2 - (layout.icon - ICON_SIZE * row.scale / 2);
  const height = ICON_SIZE * row.scale;
  return {left: row.centreX - width / 2, top: row.apexY - height / 2, width, height};
}
