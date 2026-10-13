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

/** Bars of a day or week chart: the label is day and month of the period start ("13.10."). */
export function periodBars(periods: ReadonlyArray<DashboardPeriodCount>): Array<StatsBar> {
  return periods.map((period) => {
    const [year, month, day] = period.start.split('-').map(Number);
    const label = new Date(year, month - 1, day).toLocaleDateString(undefined, {day: 'numeric', month: 'numeric'});
    return {label, value: period.value};
  });
}
