import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

/**
 * Column order of the admin overview: whoever plays in the most games comes first.
 * That way regular players always sit in the same columns; one-off names get their own column at the end.
 * Ties are alphabetical so the columns don't jump when games are added or deleted.
 */
export function playerColumns(summaries: ReadonlyArray<AdminGameSummary>): Array<string> {
  const counts = new Map<string, number>();
  for (const summary of summaries) {
    // A name counts only once per game, even if it appears twice
    for (const name of new Set(summary.players.map((player) => player.name))) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return Array.from(counts.keys()).sort((first, second) => (counts.get(second) ?? 0) - (counts.get(first) ?? 0) || first.localeCompare(second));
}
