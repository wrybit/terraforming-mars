/** Names of the strength columns (translated); other columns of a settings table show their id as it is. */
const COLUMN_LABELS: Readonly<Record<string, string>> = {easy: 'Easy', normal: 'Normal', hard: 'Hard'};

export function strengthColumnLabel(column: string): string {
  return COLUMN_LABELS[column] ?? column;
}
