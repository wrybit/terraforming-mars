import {Color} from '../Color';
import {SpaceId} from '../Types';
import {GameModel} from '../models/GameModel';
import {PublicPlayerModel} from '../models/PlayerModel';
import {SpaceModel} from '../models/SpaceModel';

// Replay track: after every save the server notes which parts of the game changed (only those), so a replay can show
// every expansion at every step exactly – also the parts the log text does not tell (colony tracks, delegates, Venus,
// Moon, planetary tracks, hazards, excavations). The server writes it (server/replay/), the client reads it
// (client/components/replay/); both sides are tested against this file.

/** Game parts taken from the track */
export const REPLAY_TRACK_GAME_KEYS = [
  'generation', 'temperature', 'oxygenLevel', 'oceans', 'venusScaleLevel', 'passedPlayers', 'milestones', 'awards',
  'colonies', 'discardedColonies', 'turmoil', 'moon', 'pathfinders', 'aresData',
] as const satisfies ReadonlyArray<keyof GameModel>;
export type ReplayTrackGameKey = typeof REPLAY_TRACK_GAME_KEYS[number];

/** Player parts taken from the track */
export const REPLAY_TRACK_PLAYER_KEYS = [
  'terraformRating', 'megacredits', 'steel', 'titanium', 'plants', 'energy', 'heat',
  'megacreditProduction', 'steelProduction', 'titaniumProduction', 'plantProduction', 'energyProduction', 'heatProduction',
  'steelValue', 'titaniumValue', 'citiesCount', 'coloniesCount', 'fleetSize', 'tradesThisGeneration', 'colonyTradeOffset',
  'cardDiscount', 'influence', 'alliedParty', 'underworldData',
] as const satisfies ReadonlyArray<keyof PublicPlayerModel>;
export type ReplayTrackPlayerKey = typeof REPLAY_TRACK_PLAYER_KEYS[number];

/**
 * What the replay also works out from the log text (client/components/replay/reconstructReplay.ts). A track that
 * does not cover the whole game (older games: only their start) must not override these, the log is closer.
 */
export const REPLAY_RECONSTRUCTED_GAME_KEYS: ReadonlySet<ReplayTrackGameKey> = new Set(['generation', 'temperature', 'oxygenLevel', 'oceans', 'passedPlayers', 'milestones', 'awards']);
export const REPLAY_RECONSTRUCTED_PLAYER_KEYS: ReadonlySet<ReplayTrackPlayerKey> = new Set([
  'terraformRating', 'megacredits', 'steel', 'titanium', 'plants', 'energy', 'heat',
  'megacreditProduction', 'steelProduction', 'titaniumProduction', 'plantProduction', 'energyProduction', 'heatProduction', 'citiesCount',
]);

export type ReplayTrackGame = Partial<Pick<GameModel, ReplayTrackGameKey>>;
export type ReplayTrackPlayer = Partial<Pick<PublicPlayerModel, ReplayTrackPlayerKey>>;

export type ReplayTrackEntry = {
  /** Length of the game log when noted: the entry holds from the step that shows line `line - 1` on */
  line: number,
  game?: ReplayTrackGame,
  /** Changed spaces of Mars (Moon spaces are part of `moon`) */
  spaces?: Array<SpaceModel>,
  players?: Partial<Record<Color, ReplayTrackPlayer>>,
};

/** All entries up to a moment folded together */
export type ReplayTrackState = {
  game: ReplayTrackGame,
  spaces: Partial<Record<SpaceId, SpaceModel>>,
  players: Partial<Record<Color, ReplayTrackPlayer>>,
};

export function emptyReplayTrackState(): ReplayTrackState {
  return {game: {}, spaces: {}, players: {}};
}

/** The state with one more entry; the given state stays unchanged */
export function applyReplayTrackEntry(state: ReplayTrackState, entry: ReplayTrackEntry): ReplayTrackState {
  const spaces = entry.spaces === undefined ? state.spaces : {...state.spaces};
  entry.spaces?.forEach((space) => spaces[space.id] = space);
  let players = state.players;
  if (entry.players !== undefined) {
    players = {...state.players};
    for (const [color, changes] of Object.entries(entry.players) as Array<[Color, ReplayTrackPlayer]>) {
      players[color] = {...players[color], ...changes};
    }
  }
  return {game: entry.game === undefined ? state.game : {...state.game, ...entry.game}, spaces, players};
}

/** The track folded up to (and including) the entries noted at log length `logLength` */
export function replayTrackAt(track: ReadonlyArray<ReplayTrackEntry>, logLength: number): ReplayTrackState {
  let state = emptyReplayTrackState();
  for (const entry of track) {
    if (entry.line > logLength) {
      break;
    }
    state = applyReplayTrackEntry(state, entry);
  }
  return state;
}
