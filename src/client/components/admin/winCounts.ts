import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

export type WinCount = {
  name: string;
  wins: number;
};

/** Siege einer festen Besetzung, z. B. "Daniel vs Jens". */
export type LineupWinCounts = {
  lineup: string;
  games: number;
  counts: Array<WinCount>;
  /** Ø Generationen; nur Partien mit bekannter Generation (Screenshots aus anderen Versionen haben keine). */
  averageGenerations: number | undefined;
  /** Ø Siegpunkte des Siegers (bei Gleichstand zählt der Sieger einmal). */
  averageWinnerPoints: number | undefined;
};

type LineupTotals = LineupWinCounts & {generationSum: number, generationGames: number, winnerPointSum: number, winnerGames: number};

function average(sum: number, count: number): number | undefined {
  return count === 0 ? undefined : sum / count;
}

/**
 * Siege je Besetzung über alle beendeten Partien (eigene und importierte).
 * Getrennt nach Besetzung, weil ein Sieg zu zweit etwas anderes ist als ein Sieg zu dritt.
 * Laufende Partien zählen nicht mit, sonst entstünden Besetzungen aus angefangenen Testspielen.
 */
export function winCountsByLineup(summaries: ReadonlyArray<AdminGameSummary>): Array<LineupWinCounts> {
  const lineups = new Map<string, LineupTotals>();
  for (const summary of summaries.filter((candidate) => candidate.isFinished)) {
    // Alphabetisch, damit dieselbe Besetzung unabhängig von der Zugreihenfolge zusammenfällt
    const names = Array.from(new Set(summary.players.map((player) => player.name))).sort((first, second) => first.localeCompare(second));
    const key = names.join(' vs ');
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
