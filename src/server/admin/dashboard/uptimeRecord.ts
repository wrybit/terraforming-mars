import * as fs from 'fs';
import * as path from 'path';
import {DashboardPeriodCount} from '../../../common/admin/ServerDashboard';
import {dayKey, lastPeriods} from './calendarDays';

/*
 * Availability of the server: every running minute is counted per day in a small file next to the database.
 * Minutes missing from a day are minutes the server was down (crash, update, machine off). The file also keeps
 * the last start times, so restarts show up on the dashboard.
 */
type UptimeFile = {
  minutesByDay: Record<string, number>,
  starts: Array<string>,
  /** Start of the recording: time before it is unknown, not downtime */
  sinceMs?: number,
};

const KEPT_DAYS = 60;
const KEPT_STARTS = 20;
const MINUTES_PER_DAY = 24 * 60; // upper bound per day, also across a daylight saving change

function defaultFile(): string {
  return process.env.UPTIME_FILE ?? path.resolve('db', 'uptime-minutes.json');
}

export class UptimeRecord {
  constructor(private readonly file: string = defaultFile()) {}

  public read(): UptimeFile {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      return {minutesByDay: parsed.minutesByDay ?? {}, starts: parsed.starts ?? [], sinceMs: parsed.sinceMs};
    } catch {
      // Missing or broken file: start counting from now
      return {minutesByDay: {}, starts: []};
    }
  }

  private write(data: UptimeFile): void {
    const days = Object.keys(data.minutesByDay).sort();
    days.slice(0, Math.max(0, days.length - KEPT_DAYS)).forEach((day) => delete data.minutesByDay[day]);
    data.starts = data.starts.slice(0, KEPT_STARTS);
    fs.mkdirSync(path.dirname(this.file), {recursive: true});
    fs.writeFileSync(this.file, JSON.stringify(data));
  }

  public noteStart(nowMs: number = Date.now()): void {
    const data = this.read();
    data.sinceMs ??= nowMs;
    data.starts.unshift(new Date(nowMs).toISOString());
    this.write(data);
  }

  public noteRunningMinute(nowMs: number = Date.now()): void {
    const data = this.read();
    const day = dayKey(nowMs);
    data.sinceMs ??= nowMs - 60 * 1000;
    data.minutesByDay[day] = Math.min(MINUTES_PER_DAY, (data.minutesByDay[day] ?? 0) + 1);
    this.write(data);
  }

  /**
   * Percent of running minutes per day (last 14 days). Only the recorded part of a day counts: today up to
   * now, the first day from the start of the recording. Days before the recording are left out.
   */
  public availability(nowMs: number = Date.now()): Array<DashboardPeriodCount> {
    const {minutesByDay, sinceMs} = this.read();
    if (sinceMs === undefined || Object.keys(minutesByDay).length === 0) {
      return [];
    }
    const firstDay = dayKey(sinceMs);
    return lastPeriods(nowMs, 14, 'day', (day) => {
      const [year, month, date] = day.split('-').map(Number);
      const dayStartMs = new Date(year, month - 1, date).getTime();
      const dayEndMs = new Date(year, month - 1, date + 1).getTime();
      const possible = Math.max(1, Math.round((Math.min(dayEndMs, nowMs) - Math.max(dayStartMs, sinceMs)) / 60000));
      return Math.min(100, Math.round((minutesByDay[day] ?? 0) * 1000 / possible) / 10);
    }).filter((period) => period.start >= firstDay);
  }
}

/** Starts counting for this process: called once at server start. */
export function startUptimeRecording(record: UptimeRecord = new UptimeRecord()): void {
  try {
    record.noteStart();
  } catch (error) {
    // The game must run even if the file cannot be written (read-only folder)
    console.error('Cannot record the server start', error);
    return;
  }
  setInterval(() => {
    try {
      record.noteRunningMinute();
    } catch (error) {
      console.error('Cannot record uptime', error);
    }
  }, 60 * 1000).unref();
}
