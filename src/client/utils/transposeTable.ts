/*
 * Gedrehte Kopie einer Tabelle für schmale Bildschirme: Zeilen werden Spalten.
 *
 * Kopfzeilen mit zusammengefassten Zellen (colspan) entfallen. Klassen, die an der Zeile hingen
 * (Spielerfarbe, Sieger), wandern auf jede Zelle der neuen Spalte.
 */

// Zeilen-Klassen, die nach dem Drehen an den Zellen gebraucht werden
const ROW_CLASS_PATTERN = /player_translucent_bg_color_\w+/;
export const PLAYER_COLUMN_CLASS = 'mb-player-col';
export const WINNER_COLUMN_CLASS = 'mb-winner-col';
const WINNER_ROW_CLASS = 'game-end-winner-row';

function hasSpanningCell(row: HTMLTableRowElement): boolean {
  return Array.from(row.cells).some((cell) => cell.colSpan > 1);
}

/* Liefert eine gedrehte Kopie von `table` (Klasse `mb-transposed`); das Original bleibt unverändert. */
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
