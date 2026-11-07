// "vor 3 Std.", "vor 12 Min.": time since an event in the viewer's game language.
// Intl translates the units itself, so no locale entries are needed.

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Largest unit first: from it on the text uses that unit (e.g. 47 h stay "47 h", only 2 days become "2 days")
const UNITS: ReadonlyArray<{unit: Intl.RelativeTimeFormatUnit, ms: number, from: number}> = [
  {unit: 'day', ms: DAY_MS, from: 2 * DAY_MS},
  {unit: 'hour', ms: HOUR_MS, from: HOUR_MS},
  {unit: 'minute', ms: MINUTE_MS, from: 0},
];

export function relativeTimeText(timeMs: number, nowMs: number, locale: string): string {
  // Clock differences between server and browser must not lead to "in 1 min"
  const elapsedMs = Math.max(0, nowMs - timeMs);
  const {unit, ms} = UNITS.find((entry) => elapsedMs >= entry.from) ?? UNITS[UNITS.length - 1];
  return new Intl.RelativeTimeFormat(locale, {numeric: 'auto', style: 'short'}).format(-Math.floor(elapsedMs / ms), unit);
}
