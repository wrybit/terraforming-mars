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
};

/**
 * Siege je Besetzung über alle beendeten Partien (eigene und importierte).
 * Getrennt nach Besetzung, weil ein Sieg zu zweit etwas anderes ist als ein Sieg zu dritt.
 * Laufende Partien zählen nicht mit, sonst entstünden Besetzungen aus angefangenen Testspielen.
 */
export function winCountsByLineup(summaries: ReadonlyArray<AdminGameSummary>): Array<LineupWinCounts> {
  const lineups = new Map<string, LineupWinCounts>();
  for (const summary of summaries.filter((candidate) => candidate.isFinished)) {
    // Alphabetisch, damit dieselbe Besetzung unabhängig von der Zugreihenfolge zusammenfällt
    const names = Array.from(new Set(summary.players.map((player) => player.name))).sort((first, second) => first.localeCompare(second));
    const key = names.join(' vs ');
    const lineup = lineups.get(key) ?? {lineup: key, games: 0, counts: names.map((name) => ({name, wins: 0}))};
    lineup.games++;
    for (const player of summary.players.filter((candidate) => candidate.isWinner)) {
      const count = lineup.counts.find((candidate) => candidate.name === player.name);
      if (count !== undefined) {
        count.wins++;
      }
    }
    lineups.set(key, lineup);
  }
  return Array.from(lineups.values())
    .map((lineup) => ({...lineup, counts: [...lineup.counts].sort((first, second) => second.wins - first.wins || first.name.localeCompare(second.name))}))
    .sort((first, second) => second.games - first.games || first.lineup.localeCompare(second.lineup));
}
