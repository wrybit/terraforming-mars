import {Color} from '@/common/Color';
import {StatsGame} from '@/common/stats/StatsGame';
import {PlayerAlias} from '@/common/admin/PlayerAliases';

/** A name as the statistics show it (old names already merged), with what the admin needs to decide a merge. */
export type PlayerNameStats = {
  name: string;
  /** Colour of the latest game: makes the same person easy to recognise in the list. */
  color: Color;
  games: number;
  wins: number;
  lastTimeMs: number;
  /** Old names that count as this name. */
  oldNames: Array<string>;
};

/** All names of the statistics games, most games first. */
export function playerNameStats(games: ReadonlyArray<StatsGame>, aliases: ReadonlyArray<PlayerAlias>): Array<PlayerNameStats> {
  const byName = new Map<string, PlayerNameStats>();
  for (const game of games) {
    const timeMs = game.summary.createdTimeMs;
    for (const player of game.summary.players) {
      const entry = byName.get(player.name) ?? {name: player.name, color: player.color, games: 0, wins: 0, lastTimeMs: 0, oldNames: []};
      entry.games++;
      entry.wins += player.isWinner ? 1 : 0;
      if (timeMs >= entry.lastTimeMs) {
        entry.lastTimeMs = timeMs;
        entry.color = player.color;
      }
      byName.set(player.name, entry);
    }
  }
  for (const alias of aliases) {
    byName.get(alias.to)?.oldNames.push(alias.from);
  }
  return [...byName.values()].sort((first, second) => second.games - first.games || first.name.localeCompare(second.name));
}

/** Games both names played in: after a merge the player counts twice there. */
export function sharedGameCount(games: ReadonlyArray<StatsGame>, first: string, second: string): number {
  return games.filter((game) => {
    const names = game.summary.players.map((player) => player.name);
    return names.includes(first) && names.includes(second);
  }).length;
}
