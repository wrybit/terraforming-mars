import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

// Bulk delete for the open games (no one online): all, the stale ones and the barely started ones.
// Only offered for the "open" group – games with players online are never deleted in bulk.

export type BulkDeleteKey = 'all' | 'stale' | 'unplayed';

/** Open games older than this count as abandoned. */
export const STALE_AGE_MS = 12 * 60 * 60 * 1000;
/** "Unplayed": still in generation 1–2 … */
export const UNPLAYED_MAX_GENERATION = 2;
/** … and at most this many project cards played per player (local games only, imports lack the count). */
export const UNPLAYED_MAX_CARDS_PER_PLAYER = 2;

export const BULK_DELETE_LABELS: Record<BulkDeleteKey, string> = {
  all: 'Delete all open',
  stale: 'Delete open older than 12 h',
  unplayed: 'Delete unplayed',
};

function isUnplayed(summary: AdminGameSummary): boolean {
  return summary.playedCardCount !== undefined &&
    summary.generation <= UNPLAYED_MAX_GENERATION &&
    summary.playedCardCount <= UNPLAYED_MAX_CARDS_PER_PLAYER * summary.players.length;
}

const FILTERS: Record<BulkDeleteKey, (summary: AdminGameSummary, nowMs: number) => boolean> = {
  all: () => true,
  stale: (summary, nowMs) => nowMs - summary.createdTimeMs >= STALE_AGE_MS,
  unplayed: (summary) => isUnplayed(summary),
};

/** IDs of the games a bulk action would delete. */
export function bulkDeleteIds(games: ReadonlyArray<AdminGameSummary>, key: BulkDeleteKey, nowMs: number = Date.now()): Array<string> {
  return games.filter((summary) => FILTERS[key](summary, nowMs)).map((summary) => summary.id);
}
