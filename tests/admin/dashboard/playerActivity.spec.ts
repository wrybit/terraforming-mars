import {expect} from 'chai';
import {playerActivity} from '../../../src/server/admin/dashboard/playerActivity';
import {dayKey, lastPeriods, weekKey} from '../../../src/server/admin/dashboard/calendarDays';

// Noon in server time, so the day never shifts with the time zone of the test machine
const at = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12).getTime();

describe('playerActivity', () => {
  const now = at(2026, 10, 14); // a Wednesday

  it('counts distinct human players per day and week', () => {
    const activity = playerActivity([
      {humanPlayers: ['Teddy', 'Jens'], eventTimesMs: [at(2026, 10, 13), at(2026, 10, 14)]},
      {humanPlayers: ['Teddy'], eventTimesMs: [at(2026, 10, 14)]},
      // Games of the AI alone do not count
      {humanPlayers: [], eventTimesMs: [at(2026, 10, 14)]},
    ], now);
    expect(activity.days).has.length(14);
    expect(activity.days.at(-1)).deep.eq({start: '2026-10-14', value: 2});
    expect(activity.days.at(-2)).deep.eq({start: '2026-10-13', value: 2});
    expect(activity.days.at(-3)).deep.eq({start: '2026-10-12', value: 0});
    expect(activity.weeks).has.length(12);
    expect(activity.weeks.at(-1)).deep.eq({start: '2026-10-12', value: 2});
  });

  it('starts weeks on Monday, also for a Sunday', () => {
    expect(weekKey(at(2026, 10, 18))).eq('2026-10-12');
    expect(weekKey(at(2026, 10, 12))).eq('2026-10-12');
    expect(dayKey(at(2026, 1, 5))).eq('2026-01-05');
  });

  it('lists periods oldest first and fills gaps with 0', () => {
    expect(lastPeriods(now, 3, 'day', () => 0).map((period) => period.start)).deep.eq(['2026-10-12', '2026-10-13', '2026-10-14']);
  });
});
