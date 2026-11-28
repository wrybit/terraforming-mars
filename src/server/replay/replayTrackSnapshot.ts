import {IGame} from '../IGame';
import {Server} from '../models/ServerModel';
import {
  REPLAY_TRACK_GAME_KEYS, REPLAY_TRACK_PLAYER_KEYS, ReplayTrackGame, ReplayTrackPlayer, ReplayTrackState,
} from '../../common/replay/ReplayTrack';
import {Color} from '../../common/Color';
import {SpaceModel} from '../../common/models/SpaceModel';
import {SpaceId} from '../../common/Types';

function pick<T extends object, K extends keyof T>(model: T, keys: ReadonlyArray<K>): Partial<Pick<T, K>> {
  const picked: Partial<Pick<T, K>> = {};
  for (const key of keys) {
    picked[key] = model[key];
  }
  return picked;
}

/**
 * The parts of the game the replay track keeps, as the players saw them (same models as the game view, so the
 * replay can show them unchanged).
 */
export function replayTrackSnapshot(game: IGame): ReplayTrackState {
  const model = Server.getGameModel(game);
  const spaces: Partial<Record<SpaceId, SpaceModel>> = {};
  model.spaces.forEach((space) => spaces[space.id] = space);
  const players: Partial<Record<Color, ReplayTrackPlayer>> = {};
  for (const player of game.players) {
    players[player.color] = pick(Server.getPlayer(player, false), REPLAY_TRACK_PLAYER_KEYS);
  }
  const gameParts: ReplayTrackGame = pick(model, REPLAY_TRACK_GAME_KEYS);
  return {game: gameParts, spaces, players};
}
