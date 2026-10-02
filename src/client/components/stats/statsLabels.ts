// Anzeigenamen, die nicht direkt aus Karten- oder Meilensteinnamen kommen (die übersetzt v-i18n selbst).

/** Spielplan-Namen sind klein geschrieben (BoardName); angezeigt wird jedes Wort groß, übersetzt wird beim Anzeigen. */
export function boardLabel(board: string): string {
  return board.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

/** Ganze Zahl oder eine Nachkommastelle, im Format der Spracheinstellung des Browsers. */
export function formatNumber(value: number | undefined, digits: number = 1): string {
  return value === undefined ? '–' : value.toLocaleString(undefined, {minimumFractionDigits: digits, maximumFractionDigits: digits});
}

export function formatPercent(value: number | undefined): string {
  return value === undefined ? '–' : `${Math.round(value * 100)} %`;
}

export function formatDate(timeMs: number): string {
  return new Date(timeMs).toLocaleDateString(undefined, {day: '2-digit', month: '2-digit', year: '2-digit'});
}

/** Abstand zur Zufalls-Siegquote in Prozentpunkten, mit Vorzeichen. */
export function formatLift(winRate: number, expected: number): string {
  const points = Math.round((winRate - expected) * 100);
  return points === 0 ? '±0' : `${points > 0 ? '+' : '−'}${Math.abs(points)}`;
}
