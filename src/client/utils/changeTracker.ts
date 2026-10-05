// Remembers which values another player changed (or the viewer took from another player) and that the viewer has not seen blink yet.
// Lives at module level on purpose: the game view is rebuilt after every server update (App.vue: key),
// the list of unseen changes has to survive that. A reload starts empty – nothing blinks then.
import {ViewModel} from '@/common/models/PlayerModel';
import {ChangeSnapshot, changeSnapshot} from '@/client/utils/changeFlashSnapshot';
import {FlashArea, flashAreaOf} from '@/client/utils/changeFlashKeys';
import {FlashTone, isAttack} from '@/client/utils/changeFlashTone';

// own: answer to the viewer's own input (only what it took away from other players blinks);
// remote: update polled because someone else acted
export type ChangeSource = 'own' | 'remote';

type Baseline = {
  participantId: string;
  generation: number;
  snapshot: ChangeSnapshot;
  // Player on turn: makes the next move, i.e. causes the next remote changes
  activeColor: string | undefined;
};

type PendingChange = {
  // Tabs that already blinked for this change (a change can sit behind several tabs, e.g. screen and segment)
  announcedBy: Set<string>;
  // Value before the first unseen change: numbers count up/down from here (changeFlashCount.ts)
  previousValue: string | undefined;
  // loss: another player took this away (changeFlashTone.ts)
  tone: FlashTone;
};

let baseline: Baseline | undefined;
const pending = new Map<string, PendingChange>();

export function ingestView(view: ViewModel, source: ChangeSource): void {
  const previous = baseline;
  const snapshot = changeSnapshot(view);
  baseline = {participantId: view.id, generation: view.game.generation, snapshot, activeColor: view.players.find((player) => player.isActive)?.color};

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
  // Own move: the viewer is the actor; otherwise whoever was on turn before this update
  const actorColor = source === 'own' ? view.thisPlayer?.color : previous.activeColor;
  for (const [key, value] of snapshot) {
    const before = previous.snapshot.get(key);
    if (before === value) {
      continue;
    }
    const attack = isAttack(key, before, value, actorColor);
    if (source === 'own' && !attack) {
      continue;
    }
    // Several unseen changes in a row: counting starts at what the viewer last saw, an attack stays an attack
    const earlier = pending.get(key);
    pending.set(key, {
      announcedBy: new Set(),
      previousValue: earlier?.previousValue ?? before,
      tone: attack ? 'loss' : (earlier?.tone ?? 'gain'),
    });
  }
}

export function isChangePending(key: string): boolean {
  return pending.has(key);
}

export function changeToneOf(key: string): FlashTone {
  return pending.get(key)?.tone ?? 'gain';
}

export function previousValueOf(key: string): string | undefined {
  return pending.get(key)?.previousValue;
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
