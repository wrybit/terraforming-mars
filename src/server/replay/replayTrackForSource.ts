import {SerializedGame} from '../SerializedGame';
import {Game} from '../Game';
import {Phase} from '../../common/Phase';
import {ReplayTrackEntry} from '../../common/replay/ReplayTrack';
import {replayTrackSnapshot} from './replayTrackSnapshot';
import {replayTrackDifference} from './replayTrackDifference';
import {emptyReplayTrackState} from '../../common/replay/ReplayTrack';

export type ReplayTrackForSource = {track: ReadonlyArray<ReplayTrackEntry>, complete: boolean};

/**
 * The track a replay gets. Noted from the first save on, it covers the whole game. Otherwise (games saved before the
 * track existed, or still running when it came) the start of the game comes first, so the replay shows the
 * expansions as they began instead of as they ended; the log decides what it can tell.
 */
export function replayTrackForSource(start: SerializedGame, end: SerializedGame): ReplayTrackForSource {
  const recorded = end.replayTrack ?? [];
  const startIsEnd = start.phase === Phase.END;
  if (recorded.length > 0 && !startIsEnd && recorded[0].line <= start.gameLog.length) {
    return {track: recorded, complete: true};
  }
  if (startIsEnd) {
    return {track: recorded, complete: false};
  }
  let baseline: ReplayTrackEntry | undefined;
  try {
    baseline = replayTrackDifference(emptyReplayTrackState(), replayTrackSnapshot(Game.deserialize(start)), 0);
  } catch (error) {
    // E.g. a card this server no longer knows: then the replay simply has no start for these parts
    console.warn(`replay: no start state for ${end.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return {track: baseline === undefined ? recorded : [baseline, ...recorded], complete: false};
}
