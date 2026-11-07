import {AiLevel} from '../ai/AiLevel';
import {BoardName} from '../boards/BoardName';
import {Expansion} from '../cards/GameModule';
import {Color} from '../Color';
import {GameSetupOptions} from '../game/GameSetupOptions';
import {NewGameConfig} from '../game/NewGameConfig';
import {PlayerId, SpectatorId} from '../Types';

// Contract between the lobby page (client/components/lobby) and the lobby routes (server/lobby).
// Both sides test against these types and limits.

/** How a player appears in the lobby. Stored only in the browser (lobbyProfile.ts); sent along with every action. */
export type LobbyProfile = {
  name: string;
  color: Color;
  /** One of LOBBY_EMOJIS; shown when there is no image */
  emoji: string;
  /** Own picture as a small data URL (image/jpeg or image/png) */
  image?: string;
};

export const LOBBY_NAME_MAX_LENGTH = 20;
export const LOBBY_TITLE_MAX_LENGTH = 40;
/** Upper bound of an uploaded picture as data URL: the client scales it to 96 px, which stays far below */
export const LOBBY_IMAGE_MAX_LENGTH = 24_000;

/** Choice of profile pictures: roughly fitting the game (space, planets, nature, industry, science) */
export const LOBBY_EMOJIS: ReadonlyArray<string> = [
  '🚀', '🪐', '🌍', '🌕', '☄️', '🛰️', '👩‍🚀', '👨‍🚀', '👽', '🤖',
  '🌋', '🏜️', '🌊', '🌱', '🌳', '🍄', '🦠', '🐛', '🐟', '🐄',
  '🏭', '⚡', '🔥', '🧪', '🔭', '⛏️', '💎', '🏙️', '💰', '🌡️',
];

export type LobbySeatModel =
  | {kind: 'free'}
  | {kind: 'ai', aiLevel: AiLevel}
  /** Entered by the host for somebody who does not use the lobby; gets the link from the host after the start */
  | {
    kind: 'guest', name: string, color: Color,
    /** Host only, waiting: secret of this seat's invitation link (lobby/room/<id>?seat=<token>) */
    inviteToken?: string,
    /** Host only, running: the guest's player page */
    playerId?: PlayerId,
  }
  | {
    kind: 'human',
    name: string,
    color: Color,
    emoji: string,
    image?: string,
    ready: boolean,
    host: boolean,
    /** The seat of the asking participant */
    you: boolean,
  };

/** Only what the lobby list and the waiting room show of the game settings (setup chips) */
export type LobbySetupModel = {
  expansions: Record<Expansion, boolean>;
  boards: ReadonlyArray<BoardName>;
  randomBoard: boolean;
  options: GameSetupOptions;
};

export type LobbyRoomState = 'open' | 'started';

export type LobbyRoomModel = {
  id: string;
  title: string;
  /** Milliseconds since the room was opened */
  ageMs: number;
  state: LobbyRoomState;
  /** false: not listed, only reachable with its link */
  listed: boolean;
  seats: ReadonlyArray<LobbySeatModel>;
  setup: LobbySetupModel;
  /** Started rooms: link for spectators */
  spectatorId?: SpectatorId;
  /** Started rooms: the game of the asking participant */
  yourPlayerId?: PlayerId;
  /** The asking participant was removed twice (joining becomes a request) or declined by the host (never again) */
  yourAccess?: 'request' | 'declined';
  /** Only for the host: players removed twice who ask to come back (approve or decline) */
  requests?: ReadonlyArray<LobbyJoinRequest>;
  /** Only for the host of a waiting room: the settings, to change them in the create form (edit) */
  config?: NewGameConfig;
  /** Started rooms: how far the game is (lobby row: generation, progress bar, time played) */
  progress?: LobbyGameProgress;
  /**
   * Not a room but a game of the AI test batches on this server (server/aiTraining): shown among the running
   * games as information; finished ones can be watched (spectatorId), running ones not (they last seconds).
   */
  aiTraining?: {finished: boolean};
};

export type LobbyGameProgress = {
  generation: number;
  /** Share of the global parameters already raised, 0 … 1 */
  terraforming: number;
  /** Milliseconds since the game started */
  playedMs: number;
  /** Lobby games: one entry per generation so far, the last one still running (LobbyGameTimeline.vue) */
  generations?: ReadonlyArray<LobbyGeneration>;
  /** Lobby games: claimed milestones and funded awards, in the order they happened */
  marks?: ReadonlyArray<LobbyGameMark>;
  /** Lobby games: estimated milliseconds until the game ends (pace of the recent generations) */
  remainingMs?: number;
};

/** Global parameters shown in the lobby timeline, in the order they are stacked */
export const LOBBY_PARAMETERS = ['temperature', 'oxygen', 'oceans', 'venus'] as const;
export type LobbyParameter = typeof LOBBY_PARAMETERS[number];

export type LobbyGeneration = {
  number: number;
  /** Length of the generation; the running one: so far */
  durationMs: number;
  /** Steps raised in this generation (temperature and Venus: one step = 2 °C or 2 %) */
  steps: Partial<Record<LobbyParameter, number>>;
};

export type LobbyGameMark = {
  kind: 'milestone' | 'award';
  /** Milestone or award name (translated on the client) */
  name: string;
  player: string;
  color: Color;
  generation: number;
  /** Milliseconds after the game started */
  atMs: number;
};

/** What the create form needs to change a waiting game (host only): its settings, name, visibility and the seats entered by hand */
export type LobbyEditRoom = {
  title: string;
  listed: boolean;
  config: NewGameConfig;
  /** Seat indexes the host entered by hand (guests); all other human seats are offered in the lobby */
  manualSeats: ReadonlyArray<number>;
};

export type LobbyJoinRequest = {participant: string, name: string, color: Color, emoji: string, image?: string};

export type LobbyListModel = {
  rooms: ReadonlyArray<LobbyRoomModel>;
  /** Room the asking participant sits in (also unlisted ones) */
  yourRoomId?: string;
  /** Room whose host still has to approve the asking participant (removed twice before) */
  requestedRoomId?: string;
  /** The host just removed the asking participant from this game (its name); told once */
  removedFrom?: string;
  /** The host just declined the asking participant's request for this game (its name); told once */
  declinedFrom?: string;
};

export type LobbyAction =
  /** config.players: seat 0 is the host; freeSeats lists the human seats offered in the lobby, other humans are guests */
  | {action: 'open', me: string, profile: LobbyProfile, title: string, listed: boolean, config: NewGameConfig, freeSeats: ReadonlyArray<number>}
  /** seatToken: from the invitation link of a seat the host entered by hand (that seat is taken) */
  | {action: 'join', me: string, profile: LobbyProfile, roomId: string, seatToken?: string}
  /** Host, while waiting: new settings from the create form, laid out like 'open'; joined players keep a free seat */
  | {action: 'edit', me: string, roomId: string, title: string, listed: boolean, config: NewGameConfig, freeSeats: ReadonlyArray<number>}
  | {action: 'profile', me: string, profile: LobbyProfile, roomId: string}
  | {action: 'leave', me: string, roomId: string}
  | {action: 'ready', me: string, roomId: string, ready: boolean}
  | {action: 'seat-ai', me: string, roomId: string, seat: number}
  | {action: 'ai-level', me: string, roomId: string, seat: number, aiLevel: AiLevel}
  /** Host: the seat becomes free (AI, entered by hand or joined; joined players are counted, see requests) */
  | {action: 'remove', me: string, roomId: string, seat: number}
  | {action: 'approve', me: string, roomId: string, participant: string}
  | {action: 'decline', me: string, roomId: string, participant: string}
  | {action: 'fill-ai', me: string, roomId: string}
  | {action: 'start', me: string, roomId: string};

/** Participant ids are random strings generated by the browser; they double as the secret of a seat */
export function isParticipantId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9]{16,40}$/.test(value);
}

/** Players per game, humans and AI together (same as the create form) */
export const LOBBY_MAX_SEATS = 6;
