/**
 * Arrangement of the settings cards of "Create game" by window width. The players column always stands
 * on the right (narrow: on top), these are only the settings columns left of it.
 */
export type SettingsCard = 'expansions' | 'expansionOptions' | 'board' | 'setup' | 'rules' | 'milestones' | 'cardPool';

export type ColumnCount = 1 | 2 | 3;

// Per column count the columns, each top to bottom (as Jens laid them out)
export const COLUMN_LAYOUTS: Record<ColumnCount, ReadonlyArray<ReadonlyArray<SettingsCard>>> = {
  1: [['expansions', 'expansionOptions', 'board', 'setup', 'rules', 'milestones', 'cardPool']],
  2: [['expansions', 'expansionOptions', 'milestones', 'cardPool'], ['setup', 'rules', 'board']],
  3: [['expansions', 'expansionOptions'], ['board'], ['setup', 'rules', 'milestones', 'cardPool']],
};

// Window widths from which 3 or 2 settings columns fit. Below 1800 the expansion tiles in the narrower
// first column cut their names off; below 1151 one column fits better.
const MIN_WIDTH_PX: ReadonlyArray<[ColumnCount, number]> = [[3, 1800], [2, 1151]];

function mediaQuery(widthPx: number): MediaQueryList | undefined {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(`(min-width: ${widthPx}px)`) : undefined;
}

/** Column count for the current window; test environments without matchMedia get one column. */
export function currentColumnCount(): ColumnCount {
  return MIN_WIDTH_PX.find(([, widthPx]) => mediaQuery(widthPx)?.matches === true)?.[0] ?? 1;
}

/** Column (0-based) and position inside it of a card. */
export function placementOf(card: SettingsCard, columnCount: ColumnCount): {column: number, order: number} {
  const columns = COLUMN_LAYOUTS[columnCount];
  const column = columns.findIndex((cards) => cards.includes(card));
  return {column, order: columns[column].indexOf(card)};
}

/** Reports every change of the column count; returns the function that ends watching. */
export function watchColumnCount(onChange: (columnCount: ColumnCount) => void): () => void {
  const queries = MIN_WIDTH_PX.map(([, widthPx]) => mediaQuery(widthPx)).filter((query) => query !== undefined);
  const listener = () => onChange(currentColumnCount());
  queries.forEach((query) => query.addEventListener('change', listener));
  return () => queries.forEach((query) => query.removeEventListener('change', listener));
}
