// Gemeinsame Formen der Statistik-Bausteine. In einer .ts-Datei, weil .ts-Dateien keine Typen aus .vue-Dateien
// importieren können (Webpack kennt dort nur den Standard-Export).

/** Eine Tabellenspalte: value liefert den Sortierwert, format die Anzeige (ohne Slot). Zellen mit Links/Balken kommen per Slot. */
export type StatsColumn = {
  key: string;
  /** Englisch, wird übersetzt. */
  label: string;
  value: (row: any) => number | string | undefined;
  format?: (row: any) => string;
  /** Text links ausgerichtet und aufsteigend sortiert; Zahlen rechts und absteigend. */
  text?: boolean;
};

export type StatsKpi = {
  /** Englisch, wird übersetzt. */
  label: string;
  value: string | number;
};

export type StatsBar = {
  label: string;
  value: number;
};
