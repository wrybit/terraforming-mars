// Display names that don't come directly from card or milestone names (those v-i18n translates itself).

/** Board names are lowercase (BoardName); each word is shown capitalized, translation happens on display. */
export function boardLabel(board: string): string {
  return board.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

/** Whole number or one decimal place, in the format of the browser's language setting. */
export function formatNumber(value: number | undefined, digits: number = 1): string {
  return value === undefined ? '–' : value.toLocaleString(undefined, {minimumFractionDigits: digits, maximumFractionDigits: digits});
}

export function formatPercent(value: number | undefined): string {
  return value === undefined ? '–' : `${Math.round(value * 100)} %`;
}

export function formatDate(timeMs: number): string {
  return new Date(timeMs).toLocaleDateString(undefined, {day: '2-digit', month: '2-digit', year: '2-digit'});
}

/** Distance from the chance win rate in percentage points, with sign. */
export function formatLift(winRate: number, expected: number): string {
  const points = Math.round((winRate - expected) * 100);
  return points === 0 ? '±0' : `${points > 0 ? '+' : '−'}${Math.abs(points)}`;
}

/** Thinking time as minutes:seconds (from one hour on hours:minutes:seconds). */
export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined) {
    return '–';
  }
  const rounded = Math.round(seconds);
  const pad = (value: number) => String(value).padStart(2, '0');
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor(rounded / 60) % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rounded % 60)}` : `${minutes}:${pad(rounded % 60)}`;
}
