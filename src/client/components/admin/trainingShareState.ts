import {AdminGameSummary} from '@/common/admin/AdminGameSummary';
import {TrainingShareStatus} from '@/common/trainingShare/TrainingShareModel';

/** What the games list offers per game for the AI training: a button, a running upload, or "Shared" as plain text */
export type GameShareState = 'available' | 'busy' | 'shared';

/**
 * Only finished games of this server can be shared (imported results have no moves); nothing is offered while
 * sharing is off. With "automatic" a button is still useful for games that ended before it was switched on.
 */
export function gameShareState(summary: AdminGameSummary, status: TrainingShareStatus | undefined, busyIds: ReadonlyArray<string>): GameShareState | undefined {
  if (status === undefined || status.mode === '' || !summary.isFinished || summary.source !== 'local') {
    return undefined;
  }
  if (status.sharedGameIds.includes(summary.id)) {
    return 'shared';
  }
  return busyIds.includes(summary.id) ? 'busy' : 'available';
}
