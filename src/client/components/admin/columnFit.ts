import {AdminGameSummary} from '@/common/admin/AdminGameSummary';
import {PlayerColumn, playersInColumn} from '@/client/components/admin/playerColumns';

// Narrow cards: before columns get too narrow and their content overlaps, player columns that no game of
// the card uses are dropped – the last ones first (AI 5, AI 4 … then Player 6, Player 5 …), as those are
// almost always empty. Only if that is not enough does the table scroll sideways.

/** Widths measured in the browser (GamesTableCard.vue), all in pixels. */
export type ColumnFitMeasure = {
  /** Space the card offers the table */
  available: number,
  /** Status, game, generation and delete column together */
  fixedWidth: number,
  /** What one shared column (spectator, players) needs so its content does not overlap */
  columnWidth: number,
  /** border-spacing between the cells */
  spacing: number,
};

export type ColumnFit = {
  columns: ReadonlyArray<PlayerColumn>,
  /** Minimum table width for these columns; wider than available = the table scrolls */
  minWidth: number,
};

/** Columns without a player in any of the games, in drop order (last column first). */
export function emptyColumnsInDropOrder(columns: ReadonlyArray<PlayerColumn>, games: ReadonlyArray<AdminGameSummary>): Array<PlayerColumn> {
  return columns
    .filter((column) => games.every((game) => playersInColumn(game, column).length === 0))
    .reverse();
}

// Fixed columns plus spectator and the player columns, with the spacing around every cell
function requiredWidth(playerColumnCount: number, measure: ColumnFitMeasure): number {
  const sharedColumns = playerColumnCount + 1;
  const cells = sharedColumns + 4;
  return measure.fixedWidth + sharedColumns * measure.columnWidth + (cells + 1) * measure.spacing;
}

/** Drops as few empty columns as needed to fit; keeps every column if there is room. */
export function fitColumns(columns: ReadonlyArray<PlayerColumn>, games: ReadonlyArray<AdminGameSummary>, measure: ColumnFitMeasure): ColumnFit {
  const droppable = emptyColumnsInDropOrder(columns, games);
  let dropCount = 0;
  while (dropCount < droppable.length && requiredWidth(columns.length - dropCount, measure) > measure.available) {
    dropCount++;
  }
  const dropped = new Set(droppable.slice(0, dropCount));
  const kept = columns.filter((column) => !dropped.has(column));
  return {columns: kept, minWidth: Math.ceil(requiredWidth(kept.length, measure))};
}
