// Build-Zeitpunkt aus settings.json (RFC-2822-Text) als "02.10.2026 @ 11:19:27" in Ortszeit des Betrachters.
// Fehlt der Wert oder ist er unlesbar, bleibt der Originaltext stehen, statt "NaN" anzuzeigen.
const twoDigits = (value: number): string => String(value).padStart(2, '0');

export function formatBuildTime(builtAt: string): string {
  const date = new Date(builtAt);
  if (Number.isNaN(date.getTime())) {
    return builtAt;
  }
  const day = `${twoDigits(date.getDate())}.${twoDigits(date.getMonth() + 1)}.${date.getFullYear()}`;
  const time = `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}:${twoDigits(date.getSeconds())}`;
  return `${day} @ ${time}`;
}
