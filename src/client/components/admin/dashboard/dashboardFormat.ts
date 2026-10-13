import {translateTextWithParams} from '@/client/directives/i18n';
import {DashboardPeriodCount} from '@/common/admin/ServerDashboard';
import {StatsBar} from '@/client/components/stats/statsTypes';

const GIGABYTE = 1024 ** 3;
const MEGABYTE = 1024 ** 2;

/** Bytes as GB (from 1 GB on) or MB, one decimal. */
export function formatBytes(bytes: number): string {
  return bytes >= GIGABYTE ? `${(bytes / GIGABYTE).toFixed(1)} GB` : `${(bytes / MEGABYTE).toFixed(1)} MB`;
}

/** Duration as "3 d 4 h", "4 h 12 min" or "12 min": two units are enough to read an uptime. */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const days = Math.floor(totalSeconds / 86400);
  if (days > 0) {
    return translateTextWithParams('${0} d ${1} h', [String(days), String(hours)]);
  }
  if (hours > 0) {
    return translateTextWithParams('${0} h ${1} min', [String(hours), String(minutes)]);
  }
  return translateTextWithParams('${0} min', [String(minutes)]);
}

/** Share in percent, rounded to whole numbers; 0 when the total is unknown. */
export function percent(part: number, total: number): number {
  return total <= 0 ? 0 : Math.round(part * 100 / total);
}

/** Date and time in the browser's language, e.g. "13.10.26, 09:48"; unreadable values (build without git) as they are. */
export function formatDateTime(time: string | number): string {
  const date = new Date(time);
  return Number.isNaN(date.getTime()) ? String(time) : date.toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'});
}

/** ISO calendar week (Monday start, week 1 holds the first Thursday of the year). */
export function calendarWeek(date: Date): number {
  // Thursday of the same week decides the year the week belongs to
  const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3 - (date.getDay() + 6) % 7);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  return 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + (firstThursday.getDay() + 6) % 7) / 7);
}

/**
 * Bars of a day or week chart: a day shows day and month ("13.10."), a week its calendar week ("CW 42"),
 * with the start date in the tooltip.
 */
export function periodBars(periods: ReadonlyArray<DashboardPeriodCount>, unit: 'day' | 'week' = 'day'): Array<StatsBar> {
  return periods.map((period) => {
    const [year, month, day] = period.start.split('-').map(Number);
    const start = new Date(year, month - 1, day);
    const date = start.toLocaleDateString(undefined, {day: 'numeric', month: 'numeric'});
    if (unit === 'day') {
      return {label: date, value: period.value};
    }
    const label = translateTextWithParams('CW ${0}', [String(calendarWeek(start))]);
    return {label, value: period.value, title: `${label} (${date}): ${period.value}`};
  });
}
