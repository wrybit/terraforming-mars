// In a .ts file because .ts files cannot import types from .vue files (webpack only knows the default export there)

/** One row of a dashboard card. */
export type DashboardFact = {
  /** English, gets translated. */
  label: string,
  value: string,
  /** Colors the value: green for good, red for a problem */
  tone?: 'good' | 'critical',
  /** Tooltip with details (e.g. the full error message) */
  title?: string,
};
