// Solo games of the stats overview: a win there means terraforming Mars in time, not beating someone,
// so they get their own box instead of a one-player "line-up" (StatsOverview.vue).
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';
import {LineupWinCounts} from '@/client/components/admin/winCounts';

export type SoloStats = {
  name: string;
  games: number;
  wins: number;
  /** Avg. generations; only games with a known generation. */
  averageGenerations: number | undefined;
  /** Avg. victory points of the solo player, won or not. */
  averagePoints: number | undefined;
};

export function isSoloLineup(lineup: LineupWinCounts): boolean {
  return lineup.counts.length === 1;
}

function average(values: ReadonlyArray<number>): number | undefined {
  return values.length === 0 ? undefined : values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Finished solo games per player, most played first. */
export function soloStats(summaries: ReadonlyArray<AdminGameSummary>): Array<SoloStats> {
  const byName = new Map<string, Array<AdminGameSummary>>();
  for (const summary of summaries.filter((candidate) => candidate.isFinished && candidate.players.length === 1)) {
    const name = summary.players[0].name;
    byName.set(name, [...(byName.get(name) ?? []), summary]);
  }
  return Array.from(byName.entries())
    .map(([name, games]) => ({
      name,
      games: games.length,
      wins: games.filter((game) => game.players[0].isWinner).length,
      averageGenerations: average(games.map((game) => game.generation).filter((generation) => generation > 0)),
      averagePoints: average(games.map((game) => game.players[0].victoryPoints)),
    }))
    .sort((first, second) => second.games - first.games || first.name.localeCompare(second.name));
}
