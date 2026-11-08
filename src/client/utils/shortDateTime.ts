// Date and time in the viewer's locale, short: "07.11.26, 17:25" (admin tables, tooltips)
export function shortDateTime(timeMs: number): string {
  return new Date(timeMs).toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'});
}
