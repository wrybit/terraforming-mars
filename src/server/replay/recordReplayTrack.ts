import {IGame} from '../IGame';
import {applyReplayTrackEntry, emptyReplayTrackState, ReplayTrackState} from '../../common/replay/ReplayTrack';
import {replayTrackSnapshot} from './replayTrackSnapshot';
import {replayTrackDifference} from './replayTrackDifference';

// Folded track per game, so a save only compares with the last state instead of folding the whole track again
const folded = new WeakMap<IGame, {length: number, state: ReplayTrackState}>();

function currentState(game: IGame): ReplayTrackState {
  const cached = folded.get(game);
  if (cached !== undefined && cached.length === game.replayTrack.length) {
    return cached.state;
  }
  // After loading or an undo the track may differ from the cache: fold it anew
  return game.replayTrack.reduce(applyReplayTrackEntry, emptyReplayTrackState());
}

/** Notes what changed since the last save (called before every save, server/database/GameLoader.ts) */
export function recordReplayTrack(game: IGame): void {
  try {
    const before = currentState(game);
    const after = replayTrackSnapshot(game);
    const entry = replayTrackDifference(before, after, game.gameLog.length);
    if (entry !== undefined) {
      game.replayTrack.push(entry);
    }
    folded.set(game, {length: game.replayTrack.length, state: after});
  } catch (error) {
    // The track is only for the replay: it must never stop a game from being saved
    console.warn(`replay track of ${game.id} not recorded: ${error instanceof Error ? error.message : String(error)}`);
  }
}
