import {Color} from '@/common/Color';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {
  REPLAY_RECONSTRUCTED_GAME_KEYS, REPLAY_RECONSTRUCTED_PLAYER_KEYS, REPLAY_TRACK_GAME_KEYS, REPLAY_TRACK_PLAYER_KEYS,
  replayTrackAt, ReplayTrackState,
} from '@/common/replay/ReplayTrack';

// Lays the replay track (common/replay/ReplayTrack.ts) over the reconstructed view: everything the track holds for a
// moment wins, so expansions (colonies, Turmoil, Venus, Moon, planetary tracks, hazards …) follow the steps too.
// A track that does not cover the whole game leaves what the log tells to the log (reconstructReplay.ts).

export type ReplayTrackView = {state: ReplayTrackState, complete: boolean};

/** The track after log line `line` (states[line] of reconstructReplay); undefined for games without one */
export function replayTrackView(source: ReplaySourceModel, line: number): ReplayTrackView | undefined {
  const track = source.track ?? [];
  if (track.length === 0) {
    return undefined;
  }
  // The first entry is the start of the game: it holds for the lines before the first save too
  return {state: replayTrackAt(track, Math.max(line + 1, track[0].line)), complete: source.trackComplete === true};
}

export function overlayGame(model: GameModel, view: ReplayTrackView | undefined): GameModel {
  if (view === undefined) {
    return model;
  }
  const result: Record<string, unknown> = {...model};
  for (const key of REPLAY_TRACK_GAME_KEYS) {
    if (key in view.state.game && (view.complete || !REPLAY_RECONSTRUCTED_GAME_KEYS.has(key))) {
      result[key] = view.state.game[key];
    }
  }
  // The board: only from a track over the whole game, else the tiles of the log stay
  if (view.complete) {
    result.spaces = model.spaces.map((space) => view.state.spaces[space.id] ?? space);
  }
  return result as GameModel;
}

export function overlayPlayer(model: PublicPlayerModel, view: ReplayTrackView | undefined): PublicPlayerModel {
  const noted = view?.state.players[model.color as Color];
  if (view === undefined || noted === undefined) {
    return model;
  }
  const result: Record<string, unknown> = {...model};
  for (const key of REPLAY_TRACK_PLAYER_KEYS) {
    if (key in noted && (view.complete || !REPLAY_RECONSTRUCTED_PLAYER_KEYS.has(key))) {
      result[key] = noted[key];
    }
  }
  return result as PublicPlayerModel;
}
