import {Warning} from '../../common/cards/Warning';
import {AdditionalProjectCosts} from '../../common/cards/Types';

// The AI loads the same snapshot many times per decision (once per candidate move). Each load
// rebuilds the active player's action menu, and checking which hand cards are playable was the
// most expensive part of it. The result only depends on the loaded state, so it is computed for
// the first load of a snapshot and replayed for the following loads of the same snapshot.

/** Outcome of the playability check of one candidate card, including its side effects on the card. */
export type PlayabilityCheck = {
  name: string,
  playable: boolean,
  warnings: ReadonlyArray<Warning>,
  additionalProjectCosts: AdditionalProjectCosts | undefined,
};

/** Snapshots kept: the decision's own snapshot plus a few second-step snapshots are enough. */
const MAXIMUM_SNAPSHOTS = 8;

let loadingSnapshot: string | undefined;
const checksBySnapshot = new Map<string, Map<string, ReadonlyArray<PlayabilityCheck>>>();

/** Runs `load` (deserializing `snapshot`) with the playability cache of that snapshot active. */
export function whileLoadingSnapshot<T>(snapshot: string, load: () => T): T {
  const outer = loadingSnapshot;
  loadingSnapshot = snapshot;
  try {
    return load();
  } finally {
    loadingSnapshot = outer;
  }
}

/** Checks recorded for this player while loading the current snapshot, if any. */
export function cachedPlayability(playerId: string): ReadonlyArray<PlayabilityCheck> | undefined {
  return loadingSnapshot === undefined ? undefined : checksBySnapshot.get(loadingSnapshot)?.get(playerId);
}

/** Records the checks of the first load of the current snapshot (no-op outside a snapshot load). */
export function recordPlayability(playerId: string, checks: ReadonlyArray<PlayabilityCheck>): void {
  if (loadingSnapshot === undefined) {
    return;
  }
  let byPlayer = checksBySnapshot.get(loadingSnapshot);
  if (byPlayer === undefined) {
    if (checksBySnapshot.size >= MAXIMUM_SNAPSHOTS) {
      // Oldest first: Map keeps insertion order.
      const oldest = checksBySnapshot.keys().next().value;
      if (oldest !== undefined) {
        checksBySnapshot.delete(oldest);
      }
    }
    byPlayer = new Map();
    checksBySnapshot.set(loadingSnapshot, byPlayer);
  }
  byPlayer.set(playerId, checks);
}
