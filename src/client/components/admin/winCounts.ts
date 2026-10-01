import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

export type WinCount = {
  name: string;
  wins: number;
  games: number;
};

/**
 * Siege und gespielte Partien je Name über alle beendeten Partien (eigene und importierte).
 * Laufende Partien zählen nicht mit, sonst sänke die Siegquote durch angefangene Spiele.
 */
export function winCounts(summaries: ReadonlyArray<AdminGameSummary>): Array<WinCount> {
  const counts = new Map<string, WinCount>();
  for (const summary of summaries.filter((candidate) => candidate.isFinished)) {
    for (const player of summary.players) {
      const count = counts.get(player.name) ?? {name: player.name, wins: 0, games: 0};
      count.games++;
      if (player.isWinner) {
        count.wins++;
      }
      counts.set(player.name, count);
    }
  }
  return Array.from(counts.values()).sort((first, second) => second.wins - first.wins || second.games - first.games || first.name.localeCompare(second.name));
}
