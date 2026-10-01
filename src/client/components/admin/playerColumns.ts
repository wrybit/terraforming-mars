import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

/**
 * Spaltenreihenfolge der Admin-Übersicht: wer in den meisten Partien mitspielt, steht vorne.
 * So stehen die festen Mitspieler immer in denselben Spalten, einmalige Namen bekommen hinten eine eigene Spalte.
 * Bei gleicher Anzahl alphabetisch, damit die Spalten nicht springen, wenn Partien dazukommen oder gelöscht werden.
 */
export function playerColumns(summaries: ReadonlyArray<AdminGameSummary>): Array<string> {
  const counts = new Map<string, number>();
  for (const summary of summaries) {
    // Ein Name zählt pro Partie nur einmal, auch wenn er doppelt vorkommt
    for (const name of new Set(summary.players.map((player) => player.name))) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return Array.from(counts.keys()).sort((first, second) => (counts.get(second) ?? 0) - (counts.get(first) ?? 0) || first.localeCompare(second));
}
