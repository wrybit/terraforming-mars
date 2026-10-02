/*
 * Transposed copy of a table for narrow screens: rows become columns.
 *
 * Header rows with merged cells (colspan) are dropped. Classes that were on the row
 * (player color, winner) move to every cell of the new column.
 */

// Row classes needed on the cells after transposing
const ROW_CLASS_PATTERN = /player_translucent_bg_color_\w+/;
export const PLAYER_COLUMN_CLASS = 'mb-player-col';
export const WINNER_COLUMN_CLASS = 'mb-winner-col';
const WINNER_ROW_CLASS = 'game-end-winner-row';

function hasSpanningCell(row: HTMLTableRowElement): boolean {
  return Array.from(row.cells).some((cell) => cell.colSpan > 1);
}

/* Returns a transposed copy of `table` (class `mb-transposed`); the original stays unchanged. */
export function transposedCopy(table: HTMLTableElement): HTMLTableElement {
  const rows = Array.from(table.rows).filter((row) => !hasSpanningCell(row));
  const copy = document.createElement('table');
  copy.className = table.className + ' mb-transposed';
  const body = document.createElement('tbody');
  const columnCount = Math.max(0, ...rows.map((row) => row.cells.length));
  for (let column = 0; column < columnCount; column++) {
    const line = document.createElement('tr');
    for (const row of rows) {
      const cell = row.cells[column];
      if (cell === undefined) {
        continue;
      }
      const clone = cell.cloneNode(true) as HTMLTableCellElement;
      const color = row.className.match(ROW_CLASS_PATTERN)?.[0];
      if (color !== undefined) {
        clone.classList.add(color, PLAYER_COLUMN_CLASS);
      }
      if (row.classList.contains(WINNER_ROW_CLASS)) {
        clone.classList.add(WINNER_COLUMN_CLASS);
      }
      line.appendChild(clone);
    }
    body.appendChild(line);
  }
  copy.appendChild(body);
  return copy;
}
