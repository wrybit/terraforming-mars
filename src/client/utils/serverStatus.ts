import {ref} from 'vue';
import {paths} from '@/common/app/paths';
import {ServerStatusModel} from '@/common/models/ServerStatusModel';

// Every open page asks the server regularly whether an update is coming (GET /api/status).
// 'updating': the server is about to restart, inputs are frozen (ServerUpdateOverlay.vue).
// 'done': a new server is running, the page has to be reloaded to match it.
export type ServerUpdatePhase = 'none' | 'updating' | 'done';

export const serverUpdatePhase = ref<ServerUpdatePhase>('none');

const POLL_MILLISECONDS = 5000;
let knownStartedAt: number | undefined;
let timer: ReturnType<typeof setInterval> | undefined;

/** Also called when the server refuses an input because of an update. */
export function markServerUpdating(): void {
  if (serverUpdatePhase.value === 'none') {
    serverUpdatePhase.value = 'updating';
  }
}

export function applyServerStatus(status: ServerStatusModel): void {
  if (status.updating) {
    markServerUpdating();
  } else if (knownStartedAt !== undefined && status.startedAt !== knownStartedAt) {
    // A different server process answers: updated (also when the announcement was missed, e.g. in a background tab)
    serverUpdatePhase.value = 'done';
  } else if (serverUpdatePhase.value === 'updating' && knownStartedAt !== undefined) {
    // Announcement withdrawn, the same server keeps running: unfreeze
    serverUpdatePhase.value = 'none';
  }
  if (knownStartedAt === undefined) {
    knownStartedAt = status.startedAt;
  }
}

async function poll(participantId: string | undefined): Promise<void> {
  const query = participantId === undefined ? '' : '?id=' + encodeURIComponent(participantId);
  try {
    const response = await fetch(paths.API_STATUS + query, {cache: 'no-store'});
    // During the switch the proxy answers with an error: keep the current state until the new server answers
    if (response.ok) {
      applyServerStatus(await response.json());
    }
  } catch {
    // Server unreachable: same as above
  }
}

/** participantId: the player or spectator id of a game page, so the server knows somebody is playing. */
export function startServerStatusPolling(participantId: string | undefined): void {
  if (timer !== undefined) {
    return;
  }
  void poll(participantId);
  timer = setInterval(() => void poll(participantId), POLL_MILLISECONDS);
}

/** Only for tests. */
export function resetServerStatus(): void {
  if (timer !== undefined) {
    clearInterval(timer);
    timer = undefined;
  }
  knownStartedAt = undefined;
  serverUpdatePhase.value = 'none';
}
