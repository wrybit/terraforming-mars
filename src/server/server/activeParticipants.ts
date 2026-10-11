import {ParticipantId} from '../../common/Types';

// Who is playing right now: game pages of running games poll the server regularly (GET /api/status).
// The update script of the test server only restarts the server when nobody is playing.
const ACTIVE_WINDOW_MILLISECONDS = 3 * 60 * 1000;
const lastSeen = new Map<ParticipantId, number>();

export function noteActiveParticipant(id: ParticipantId, now: number = Date.now()): void {
  lastSeen.set(id, now);
}

export function activeParticipantCount(now: number = Date.now()): number {
  for (const [id, seen] of lastSeen) {
    if (now - seen > ACTIVE_WINDOW_MILLISECONDS) {
      lastSeen.delete(id);
    }
  }
  return lastSeen.size;
}

/** Only for tests. */
export function clearActiveParticipants(): void {
  lastSeen.clear();
}
