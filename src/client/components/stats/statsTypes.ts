// Shared shapes of the stats building blocks. In a .ts file because .ts files can't import types from .vue files
// (Webpack only knows the default export there).

/** A table column: value returns the sort value, format the display (without slot). Cells with links/bars come via slot. */
export type StatsColumn = {
  key: string;
  /** English, gets translated. */
  label: string;
  value: (row: any) => number | string | undefined;
  format?: (row: any) => string;
  /** Text left-aligned and sorted ascending; numbers right-aligned and descending. */
  text?: boolean;
};

export type StatsKpi = {
  /** English, gets translated. */
  label: string;
  value: string | number;
};

export type StatsBar = {
  label: string;
  value: number;
  /** Part of the bar that is stacked highlighted at the bottom (e.g. of which wins). */
  highlight?: number;
  /** Tooltip; without one, “label: value” is shown. */
  title?: string;
};

/** A point of a line; highlighted points (e.g. wins) are drawn larger and yellow. */
export type StatsChartPoint = {
  value: number | undefined;
  highlight?: boolean;
  title?: string;
};

export type StatsChartSeries = {
  /** Display name; gets translated (player names stay unchanged). */
  name: string;
  /** Color like the player colors (red, green, blue …). */
  color: string;
  points: Array<StatsChartPoint>;
};
