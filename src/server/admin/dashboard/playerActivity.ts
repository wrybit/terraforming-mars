import {DashboardDayProfile, DashboardPeriodCount} from '../../../common/admin/ServerDashboard';
import {dayKey, lastPeriods, weekKey} from './calendarDays';

/** What the activity count needs to know about one game. */
export type GameActivity = {
  /** Names of the human players (AI players do not count as users) */
  humanPlayers: ReadonlyArray<string>,
  /** Times at which something happened in the game (its log entries) */
  eventTimesMs: ReadonlyArray<number>,
};

/**
 * Distinct human players per day and per week: a player counts on a day when their game had at least one log
 * entry then. Names identify players, since the server has no user accounts.
 */
export function playerActivity(games: ReadonlyArray<GameActivity>, nowMs: number): {days: Array<DashboardPeriodCount>, weeks: Array<DashboardPeriodCount>, dayProfiles: Array<DashboardDayProfile>} {
  const playersByDay = new Map<string, Set<string>>();
  const playersByWeek = new Map<string, Set<string>>();
  // Key "YYYY-MM-DD h": who played in that hour
  const playersByHour = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, key: string, players: ReadonlyArray<string>) => {
    const set = map.get(key) ?? new Set<string>();
    players.forEach((player) => set.add(player));
    map.set(key, set);
  };
  for (const game of games) {
    if (game.humanPlayers.length === 0) {
      continue;
    }
    const days = new Set(game.eventTimesMs.map(dayKey));
    const weeks = new Set(game.eventTimesMs.map(weekKey));
    const hours = new Set(game.eventTimesMs.map((time) => `${dayKey(time)} ${new Date(time).getHours()}`));
    days.forEach((day) => add(playersByDay, day, game.humanPlayers));
    weeks.forEach((week) => add(playersByWeek, week, game.humanPlayers));
    hours.forEach((hour) => add(playersByHour, hour, game.humanPlayers));
  }
  const today = dayKey(nowMs);
  const currentHour = new Date(nowMs).getHours();
  return {
    days: lastPeriods(nowMs, 14, 'day', (start) => playersByDay.get(start)?.size ?? 0),
    weeks: lastPeriods(nowMs, 12, 'week', (start) => playersByWeek.get(start)?.size ?? 0),
    dayProfiles: lastPeriods(nowMs, 28, 'day', () => 0).map(({start}) => ({
      start,
      // Today only up to the current hour: the rest of the day has not happened yet
      hours: Array.from({length: start === today ? currentHour + 1 : 24}, (_, hour) => playersByHour.get(`${start} ${hour}`)?.size ?? 0),
    })),
  };
}
