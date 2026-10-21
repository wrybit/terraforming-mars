import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {ActionLabel} from '@/client/components/overview/ActionLabel';
import {InterfaceTagsType} from '@/client/components/overview/playerTagDetails';

// Player list as a table: always all sections (goods, tags, score), arranged and scaled to the available width.
// Wide: one line per player. Narrower: name + score above goods + tags. Narrower still: goods and tags
// each on their own line with the icon inside the cells. Phone: cards below each other.
// The table never scrolls sideways – when an arrangement doesn't fit legibly, the next one takes over.

// One table row: player plus what PlayersOverview already computes for the classic bar
export type PlayersTableRowModel = {
  player: PublicPlayerModel;
  firstForGen: boolean;
  actionLabel: ActionLabel;
  playerIndex: number;
};

// Visible tag columns in groups (main tags | special tags), separated by a gap as in the classic bar
export type TagColumnGroups = Array<Array<InterfaceTagsType>>;

export type PlayersTableMode = 'line' | 'two-lines' | 'three-lines' | 'cards';

export type PlayersTableFit = {
  mode: PlayersTableMode;
  // Factor for fonts, icons and cells (1 = the size of the classic table)
  scale: number;
  // Corporation line under the name; only once the numbers are at full size
  showCorporation: boolean;
  // Extra gap between cells once everything is at its largest (px); sections get 2.5 times as much
  extraGap: number;
};

// Measures at scale 1
const NAME_WIDTH = 196;
const COMPACT_NAME_WIDTH = 140;
const MIN_COMPACT_NAME_WIDTH = 124;
// Escape Velocity adds a clock line under the name – it always needs the wide column
const ESCAPE_VELOCITY_NAME_WIDTH = 252;
// Room for a three-digit stock ("250") plus the production plaque
const GOODS_WIDTH = 80;
// With the resource icon inside the box (three lines, cards)
const GOODS_WITH_ICON_WIDTH = 100;
const TAG_WIDTH = 36;
const SCORE_WIDTH = 38;
const PLAYED_CARDS_WIDTH = 48;
const CELL_GAP = 4;
// Between sections clearly more than between cells (law of proximity)
const SECTION_GAP = 14;
const TAG_GROUP_GAP = 6;
// Colour bar, paddings and border of a row
const ROW_FRAME = 30;
const GOODS_COUNT = 6;
const SCORE_COUNT = 4;

const MIN_SCALE = 0.6;
const MAX_SCALE = 1.25;
// Below this the three-line arrangement gets too small – cards take over
const MIN_THREE_LINES_SCALE = 0.75;
// Wider than this the gaps stop growing (px per cell gap)
const MAX_EXTRA_GAP = 10;

const tagCount = (tagColumns: TagColumnGroups) => tagColumns.reduce((sum, group) => sum + group.length, 0);
const groupGaps = (tagColumns: TagColumnGroups) => Math.max(0, tagColumns.length - 1) * TAG_GROUP_GAP;
const cellsWidth = (count: number, cellWidth: number, scale: number) => count * Math.round(cellWidth * scale) + Math.max(0, count - 1) * CELL_GAP;

function goodsWidth(scale: number, withIcon: boolean): number {
  return cellsWidth(GOODS_COUNT, withIcon ? GOODS_WITH_ICON_WIDTH : GOODS_WIDTH, scale);
}

function tagsWidth(scale: number, tagColumns: TagColumnGroups): number {
  return cellsWidth(tagCount(tagColumns), TAG_WIDTH, scale) + groupGaps(tagColumns);
}

function scoreWidth(scale: number): number {
  return cellsWidth(SCORE_COUNT, SCORE_WIDTH, scale) + CELL_GAP + Math.round(PLAYED_CARDS_WIDTH * scale);
}

export function nameColumnWidth(scale: number, showCorporation: boolean, escapeVelocity: boolean): number {
  if (escapeVelocity) {
    return Math.round(ESCAPE_VELOCITY_NAME_WIDTH * Math.max(scale, 0.85));
  }
  // Never narrower than the game menu button in the header above it
  return showCorporation ? Math.round(NAME_WIDTH * scale) : Math.max(MIN_COMPACT_NAME_WIDTH, Math.round(COMPACT_NAME_WIDTH * scale));
}

// Width an arrangement needs at the given scale (without extra gaps)
export function lineWidth(scale: number, tagColumns: TagColumnGroups, showCorporation: boolean, escapeVelocity: boolean): number {
  return ROW_FRAME + nameColumnWidth(scale, showCorporation, escapeVelocity) + 3 * SECTION_GAP + goodsWidth(scale, false) + tagsWidth(scale, tagColumns) + scoreWidth(scale);
}

export function twoLinesWidth(scale: number, tagColumns: TagColumnGroups): number {
  return ROW_FRAME + goodsWidth(scale, false) + SECTION_GAP + tagsWidth(scale, tagColumns);
}

export function threeLinesWidth(scale: number, tagColumns: TagColumnGroups): number {
  return ROW_FRAME + Math.max(goodsWidth(scale, true), cellsWidth(tagCount(tagColumns), TAG_WIDTH, scale));
}

// Largest scale (in 1 % steps) at which the arrangement fits; undefined if not even the minimum does
function largestScale(widthAt: (scale: number) => number, available: number, minimum: number): number | undefined {
  for (let percent = Math.round(MAX_SCALE * 100); percent >= Math.round(minimum * 100); percent--) {
    if (widthAt(percent / 100) <= available) {
      return percent / 100;
    }
  }
  return undefined;
}

// Space left over at the largest scale goes into the gaps
function extraGap(available: number, needed: number, scale: number, tagColumns: TagColumnGroups): number {
  if (scale < MAX_SCALE) {
    return 0;
  }
  const cellGapCount = (GOODS_COUNT - 1) + Math.max(0, tagCount(tagColumns) - 1) + SCORE_COUNT;
  return Math.min(MAX_EXTRA_GAP, Math.max(0, available - needed) / (cellGapCount + 3 * 2.5));
}

export function fitPlayersTable(available: number, tagColumns: TagColumnGroups, escapeVelocity: boolean = false): PlayersTableFit {
  // Not measured yet (table hidden): the classic size
  if (available <= 0) {
    return {mode: 'line', scale: 1, showCorporation: true, extraGap: 0};
  }
  // One line: the numbers grow first; the corporation comes in only once they are at full size
  const withCorporation = largestScale((scale) => lineWidth(scale, tagColumns, true, escapeVelocity), available, 1);
  if (withCorporation !== undefined) {
    const gap = extraGap(available, lineWidth(withCorporation, tagColumns, true, escapeVelocity), withCorporation, tagColumns);
    return {mode: 'line', scale: withCorporation, showCorporation: true, extraGap: gap};
  }
  const compact = largestScale((scale) => lineWidth(scale, tagColumns, false, escapeVelocity), available, MIN_SCALE);
  if (compact !== undefined) {
    // Room left at this size: rather show the corporation than leave the space empty
    const showCorporation = lineWidth(compact, tagColumns, true, escapeVelocity) <= available;
    return {mode: 'line', scale: compact, showCorporation, extraGap: 0};
  }
  const twoLines = largestScale((scale) => twoLinesWidth(scale, tagColumns), available, MIN_SCALE);
  const threeLines = largestScale((scale) => threeLinesWidth(scale, tagColumns), available, MIN_THREE_LINES_SCALE);
  // Two lines only while they are not much smaller than three lines would be
  if (twoLines !== undefined && (twoLines >= 0.72 || threeLines === undefined || twoLines >= threeLines - 0.1)) {
    return {mode: 'two-lines', scale: twoLines, showCorporation: true, extraGap: 0};
  }
  if (threeLines !== undefined) {
    return {mode: 'three-lines', scale: Math.min(threeLines, 1.1), showCorporation: true, extraGap: 0};
  }
  return {mode: 'cards', scale: Math.min(1, Math.max(0.78, available / 430)), showCorporation: true, extraGap: 0};
}

// Column templates of the sections – identical for the header and every row so the columns line up
export function goodsTemplate(fit: PlayersTableFit): string {
  if (fit.mode === 'cards') {
    return 'repeat(3, minmax(0, 1fr))';
  }
  if (fit.mode === 'three-lines') {
    return `repeat(${GOODS_COUNT}, minmax(0, 1fr))`;
  }
  return `repeat(${GOODS_COUNT}, minmax(${Math.round(GOODS_WIDTH * fit.scale)}px, 1fr))`;
}

export function tagsTemplate(fit: PlayersTableFit, tagColumns: TagColumnGroups): string {
  if (fit.mode === 'cards') {
    return 'repeat(7, minmax(0, 1fr))';
  }
  if (fit.mode === 'three-lines') {
    return `repeat(${tagCount(tagColumns)}, minmax(0, 1fr))`;
  }
  const cell = `minmax(${Math.round(TAG_WIDTH * fit.scale)}px, 1fr)`;
  return tagColumns.map((group) => `repeat(${group.length}, ${cell})`).join(` ${TAG_GROUP_GAP}px `);
}

export function scoreTemplate(fit: PlayersTableFit): string {
  return `repeat(${SCORE_COUNT}, minmax(${Math.round(SCORE_WIDTH * fit.scale)}px, 1fr)) minmax(${Math.round(PLAYED_CARDS_WIDTH * fit.scale)}px, 1fr)`;
}

// Rows of one and two lines: the sections share the width in proportion to what they need, so leftover
// space widens every box a little instead of collecting as a gap at the end of the row
function sectionWeights(fit: PlayersTableFit, tagColumns: TagColumnGroups): {goods: number, tags: number, score: number} {
  return {
    goods: Math.round(goodsWidth(fit.scale, false)),
    tags: Math.round(tagsWidth(fit.scale, tagColumns)),
    score: Math.round(scoreWidth(fit.scale)),
  };
}

// CSS variables of the table (players_table.less)
export function tableVariables(fit: PlayersTableFit, tagColumns: TagColumnGroups, escapeVelocity: boolean): Record<string, string> {
  const weights = sectionWeights(fit, tagColumns);
  return {
    '--players-table-scale': String(fit.scale),
    '--players-table-name-width': `${nameColumnWidth(fit.scale, fit.showCorporation, escapeVelocity)}px`,
    '--players-table-cell-gap': `${CELL_GAP + fit.extraGap}px`,
    '--players-table-section-gap': `${SECTION_GAP + fit.extraGap * 2.5}px`,
    '--players-table-goods-columns': goodsTemplate(fit),
    '--players-table-tag-columns': tagsTemplate(fit, tagColumns),
    '--players-table-score-columns': scoreTemplate(fit),
    '--players-table-line-columns': `${nameColumnWidth(fit.scale, fit.showCorporation, escapeVelocity)}px minmax(0, ${weights.goods}fr) minmax(0, ${weights.tags}fr) minmax(0, ${weights.score}fr)`,
    '--players-table-two-lines-columns': `minmax(0, ${weights.goods}fr) minmax(0, ${weights.tags}fr)`,
  };
}
