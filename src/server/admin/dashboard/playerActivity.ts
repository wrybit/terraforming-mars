import {DashboardPeriodCount} from '../../../common/admin/ServerDashboard';
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
export function playerActivity(games: ReadonlyArray<GameActivity>, nowMs: number): {days: Array<DashboardPeriodCount>, weeks: Array<DashboardPeriodCount>} {
  const playersByDay = new Map<string, Set<string>>();
  const playersByWeek = new Map<string, Set<string>>();
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
    days.forEach((day) => add(playersByDay, day, game.humanPlayers));
    weeks.forEach((week) => add(playersByWeek, week, game.humanPlayers));
  }
  return {
    days: lastPeriods(nowMs, 14, 'day', (start) => playersByDay.get(start)?.size ?? 0),
    weeks: lastPeriods(nowMs, 12, 'week', (start) => playersByWeek.get(start)?.size ?? 0),
  };
}
