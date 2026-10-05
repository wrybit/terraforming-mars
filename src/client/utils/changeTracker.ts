// Remembers which values another player changed and that the viewer has not seen blink yet.
// Lives at module level on purpose: the game view is rebuilt after every server update (App.vue: key),
// the list of unseen changes has to survive that. A reload starts empty – nothing blinks then.
import {ViewModel} from '@/common/models/PlayerModel';
import {ChangeSnapshot, changeSnapshot} from '@/client/utils/changeFlashSnapshot';
import {FlashArea, flashAreaOf} from '@/client/utils/changeFlashKeys';

// own: answer to the viewer's own input (their own changes must not blink);
// remote: update polled because someone else acted
export type ChangeSource = 'own' | 'remote';

type Baseline = {
  participantId: string;
  generation: number;
  snapshot: ChangeSnapshot;
};

type PendingChange = {
  // Tabs that already blinked for this change (a change can sit behind several tabs, e.g. screen and segment)
  announcedBy: Set<string>;
};

let baseline: Baseline | undefined;
const pending = new Map<string, PendingChange>();

export function ingestView(view: ViewModel, source: ChangeSource): void {
  const previous = baseline;
  const snapshot = changeSnapshot(view);
  baseline = {participantId: view.id, generation: view.game.generation, snapshot};

  // First view after loading (or another game): nothing to compare with
  if (previous === undefined || previous.participantId !== view.id) {
    pending.clear();
    return;
  }
  // Generation change: production touches almost everything, so nothing blinks;
  // what was still unseen from the old generation is stale by now
  if (previous.generation !== view.game.generation) {
    pending.clear();
    return;
  }
  if (source === 'own') {
    return;
  }
  for (const [key, value] of snapshot) {
    if (previous.snapshot.get(key) !== value) {
      pending.set(key, {announcedBy: new Set()});
    }
  }
}

export function isChangePending(key: string): boolean {
  return pending.has(key);
}

export function markChangeSeen(key: string): void {
  pending.delete(key);
}

// Pending keys of the given areas this tab has not yet blinked for
export function unannouncedChanges(tabId: string, areas: ReadonlyArray<FlashArea>): Array<string> {
  return Array.from(pending.entries())
    .filter(([key, change]) => !change.announcedBy.has(tabId) && areas.includes(flashAreaOf(key)))
    .map(([key]) => key);
}

export function markChangeAnnounced(key: string, tabId: string): void {
  pending.get(key)?.announcedBy.add(tabId);
}

// Tests only
export function resetChangeTracker(): void {
  baseline = undefined;
  pending.clear();
}
