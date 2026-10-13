import {DashboardPeriodCount} from '../../../common/admin/ServerDashboard';

/** Day in server time as YYYY-MM-DD (the dashboard groups by the clock of the server, not UTC). */
export function dayKey(timeMs: number): string {
  const date = new Date(timeMs);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Monday of the week containing this time, as YYYY-MM-DD. */
export function weekKey(timeMs: number): string {
  const date = new Date(timeMs);
  // getDay(): Sunday = 0. Weeks start on Monday, so Sunday belongs to the week that began six days earlier
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return dayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday, 12).getTime());
}

/**
 * The last `count` days (or weeks) up to `nowMs`, oldest first, each with the value of `valueOf`.
 * Periods without data get 0, so the chart shows gaps instead of hiding them.
 */
export function lastPeriods(nowMs: number, count: number, unit: 'day' | 'week', valueOf: (start: string) => number): Array<DashboardPeriodCount> {
  const periods: Array<DashboardPeriodCount> = [];
  const stepDays = unit === 'day' ? 1 : 7;
  const today = new Date(nowMs);
  for (let index = count - 1; index >= 0; index--) {
    // Noon avoids landing on the wrong day when daylight saving time shifts the clock
    const time = new Date(today.getFullYear(), today.getMonth(), today.getDate() - index * stepDays, 12).getTime();
    const start = unit === 'day' ? dayKey(time) : weekKey(time);
    periods.push({start, value: valueOf(start)});
  }
  return periods;
}
