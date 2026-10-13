import * as fs from 'fs';
import * as path from 'path';
import {DashboardDayProfile} from '../../../common/admin/ServerDashboard';
import {dayKey} from './calendarDays';

/*
 * Who is online when: open game pages of running games poll the server every few seconds (api/status). Each
 * player seen in a 5-minute slot counts once for that slot. Kept per day in a small file next to the database,
 * so the admin dashboard can lay all days on top of each other and show the busy times of the server.
 */
const SLOT_MINUTES = 5;
export const SLOTS_PER_DAY = 24 * 60 / SLOT_MINUTES;
const KEPT_DAYS = 400;

type PresenceFile = {
  slotsByDay: Record<string, Array<number>>,
};

function defaultFile(): string {
  return process.env.PRESENCE_FILE ?? path.resolve('db', 'presence-slots.json');
}

function slotOf(timeMs: number): {day: string, slot: number} {
  const date = new Date(timeMs);
  return {day: dayKey(timeMs), slot: Math.floor((date.getHours() * 60 + date.getMinutes()) / SLOT_MINUTES)};
}

export class PresenceRecord {
  // Players seen per slot ("YYYY-MM-DD slot") not yet written; a slot stays here until it is over
  private readonly pending = new Map<string, Set<string>>();

  constructor(private readonly file: string = defaultFile()) {}

  public notePlayer(playerId: string, nowMs: number = Date.now()): void {
    const {day, slot} = slotOf(nowMs);
    const key = `${day} ${slot}`;
    const players = this.pending.get(key) ?? new Set<string>();
    players.add(playerId);
    this.pending.set(key, players);
  }

  public read(): PresenceFile {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      return {slotsByDay: parsed.slotsByDay ?? {}};
    } catch {
      return {slotsByDay: {}};
    }
  }

  /** Writes the counts of the pending slots; finished slots leave memory. Called every minute. */
  public flush(nowMs: number = Date.now()): void {
    const data = this.read();
    const current = slotOf(nowMs);
    data.slotsByDay[current.day] ??= Array(SLOTS_PER_DAY).fill(0);
    for (const [key, players] of this.pending) {
      const [day, slotText] = key.split(' ');
      const slots = data.slotsByDay[day] ??= Array(SLOTS_PER_DAY).fill(0);
      slots[Number(slotText)] = Math.max(slots[Number(slotText)] ?? 0, players.size);
      if (key !== `${current.day} ${current.slot}`) {
        this.pending.delete(key);
      }
    }
    const days = Object.keys(data.slotsByDay).sort();
    days.slice(0, Math.max(0, days.length - KEPT_DAYS)).forEach((day) => delete data.slotsByDay[day]);
    fs.mkdirSync(path.dirname(this.file), {recursive: true});
    fs.writeFileSync(this.file, JSON.stringify(data));
  }

  /** Every recorded day, oldest first; today only up to the current slot (the rest has not happened yet). */
  public profiles(nowMs: number = Date.now()): Array<DashboardDayProfile> {
    const {slotsByDay} = this.read();
    const current = slotOf(nowMs);
    return Object.keys(slotsByDay).sort().map((day) => ({
      start: day,
      slots: day === current.day ? slotsByDay[day].slice(0, current.slot + 1) : slotsByDay[day],
    }));
  }
}

/** One record per server process: api/status feeds it, the dashboard reads it. */
export const presenceRecord = new PresenceRecord();

/** Writes the presence every minute: called once at server start. */
export function startPresenceRecording(record: PresenceRecord = presenceRecord): void {
  setInterval(() => {
    try {
      record.flush();
    } catch (error) {
      // The game must run even if the file cannot be written
      console.error('Cannot record presence', error);
    }
  }, 60 * 1000).unref();
}
