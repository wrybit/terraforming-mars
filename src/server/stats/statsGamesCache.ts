import {IGameLoader} from '../database/IGameLoader';
import {collectStatsGames} from './collectStatsGames';
import {StatsGame} from '../../common/stats/StatsGame';

// The statistics page is public: without this, every call would walk all games and load the running ones
// from the database again. One minute is short enough that a finished game shows up soon after.
const MAX_AGE_MS = 60_000;

type Entry = {createdAtMs: number, games: Promise<Array<StatsGame>>};
let entry: Entry | undefined;

/** The finished games for the statistics page, collected at most once per minute (parallel calls share one run). */
export function cachedStatsGames(gameLoader: IGameLoader, nowMs: number = Date.now()): Promise<Array<StatsGame>> {
  if (entry === undefined || nowMs - entry.createdAtMs >= MAX_AGE_MS) {
    const games = collectStatsGames(gameLoader);
    entry = {createdAtMs: nowMs, games};
    // A failed run must not be served for a whole minute
    games.catch(() => {
      if (entry?.games === games) {
        entry = undefined;
      }
    });
  }
  return entry.games;
}

/** After the admin imported or deleted a game: the next call collects anew. */
export function forgetCachedStatsGames(): void {
  entry = undefined;
}
