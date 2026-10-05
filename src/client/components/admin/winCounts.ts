import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

export type WinCount = {
  name: string;
  wins: number;
};

/** Wins of a fixed line-up, e.g. "Daniel vs Jens". */
export type LineupWinCounts = {
  lineup: string;
  games: number;
  counts: Array<WinCount>;
  /** Avg. generations; only games with a known generation (screenshots from other versions have none). */
  averageGenerations: number | undefined;
  /** Avg. victory points of the winner (on a tie the winner counts once). */
  averageWinnerPoints: number | undefined;
};

type LineupTotals = LineupWinCounts & {generationSum: number, generationGames: number, winnerPointSum: number, winnerGames: number};

/** Key of a line-up – alphabetical, so the same line-up coincides regardless of turn order. */
export function lineupKey(summary: Pick<AdminGameSummary, 'players'>): string {
  return Array.from(new Set(summary.players.map((player) => player.name))).sort((first, second) => first.localeCompare(second)).join(' vs ');
}

function average(sum: number, count: number): number | undefined {
  return count === 0 ? undefined : sum / count;
}

/**
 * Wins per line-up across all finished games (own and imported).
 * Separated by line-up, because a win with two players is something else than a win with three.
 * Running games don't count, otherwise line-ups from started test games would appear.
 */
export function winCountsByLineup(summaries: ReadonlyArray<AdminGameSummary>): Array<LineupWinCounts> {
  const lineups = new Map<string, LineupTotals>();
  for (const summary of summaries.filter((candidate) => candidate.isFinished)) {
    const key = lineupKey(summary);
    const names = key.split(' vs ');
    const lineup = lineups.get(key) ?? {
      lineup: key, games: 0, counts: names.map((name) => ({name, wins: 0})), averageGenerations: undefined, averageWinnerPoints: undefined,
      generationSum: 0, generationGames: 0, winnerPointSum: 0, winnerGames: 0,
    };
    lineup.games++;
    if (summary.generation > 0) {
      lineup.generationSum += summary.generation;
      lineup.generationGames++;
    }
    const winnerPoints = summary.players.find((player) => player.isWinner)?.victoryPoints;
    if (winnerPoints !== undefined) {
      lineup.winnerPointSum += winnerPoints;
      lineup.winnerGames++;
    }
    for (const player of summary.players.filter((candidate) => candidate.isWinner)) {
      const count = lineup.counts.find((candidate) => candidate.name === player.name);
      if (count !== undefined) {
        count.wins++;
      }
    }
    lineups.set(key, lineup);
  }
  return Array.from(lineups.values())
    .map(({lineup, games, counts, generationSum, generationGames, winnerPointSum, winnerGames}) => ({
      lineup,
      games,
      counts: [...counts].sort((first, second) => second.wins - first.wins || first.name.localeCompare(second.name)),
      averageGenerations: average(generationSum, generationGames),
      averageWinnerPoints: average(winnerPointSum, winnerGames),
    }))
    .sort((first, second) => second.games - first.games || first.lineup.localeCompare(second.lineup));
}
