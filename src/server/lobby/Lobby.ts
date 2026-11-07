import {AiLevel, DEFAULT_AI_LEVEL, isAiLevel} from '../../common/ai/AiLevel';
import {AI_ANALYSIS_DEFAULT} from '../../common/ai/aiAnalysisDefault';
import {aiUnsupportedReasons} from '../../common/ai/aiSupport';
import {Color, PLAYER_COLORS} from '../../common/Color';
import {setupOptionsFromConfig} from '../../common/game/GameSetupOptions';
import {NewGameConfig, NewPlayerModel} from '../../common/game/NewGameConfig';
import {LobbyListModel, LobbyProfile, LobbyRoomModel, LobbySeatModel, LOBBY_MAX_SEATS} from '../../common/lobby/LobbyModel';
import {GameId, PlayerId, SpectatorId} from '../../common/Types';
import {LobbyError, sanitizeProfile, sanitizeTitle} from './lobbyValidation';
import {lobbyRoomPath} from '../../common/lobby/lobbyUrl';
import {fileStorage, LobbyStorage} from './lobbyStorage';

/** A participant who stops polling (closed tab, lost connection) loses the seat after this time */
export const PARTICIPANT_TIMEOUT_MS = 45_000;
/**
 * Started rooms stay in the list as "running" until the game ends or is deleted (forgetGame).
 * This is only the safety net for games nobody finishes on a server that never purges them.
 */
export const STARTED_ROOM_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
/**
 * A host who can be reached by push message (LobbyPush) keeps the open game this long without the lobby open:
 * the message about a join can still bring the host back.
 */
export const REACHABLE_HOST_TIMEOUT_MS = 30 * 60 * 1000;
/** A game whose creator is gone this long, before anything happened and with nobody else ever there, is closed */
export const ABANDONED_AFTER_MS = 3 * 60 * 1000;
/** Rooms nobody completes are dropped at the latest after this time */
export const OPEN_ROOM_MAX_AGE_MS = 12 * 60 * 60 * 1000;
/** Removed this often by the host, a player may only come back when the host approves */
export const KICKS_BEFORE_REQUEST = 2;

/** The part of a created game the lobby needs (IGame satisfies it) */
export type StartedGame = {
  id: GameId;
  spectatorId: SpectatorId | undefined;
  players: ReadonlyArray<{id: PlayerId}>;
};
/** What the lobby needs to know about running games to close abandoned ones (lobbyGameProbe.ts) */
export type GameProbe = {
  /** A player page (player id) or the links page (game id) was open within the last minutes */
  isPresent(id: PlayerId | GameId): boolean;
  /** Whether anything happened beyond choosing corporation and starting cards; undefined: the game is gone */
  hasBegun(gameId: GameId): Promise<boolean | undefined>;
  close(gameId: GameId): Promise<void>;
};

/** Generation and terraforming of a running game (lobbyGameProbe.ts); undefined: the game is gone */
export type GameProgressSource = (gameId: GameId) => Promise<{generation: number, terraforming: number} | undefined>;

/** Push messages to hosts (LobbyPush.ts); the lobby itself only knows when to send one */
export type LobbyNotifier = {
  canReach(participant: string): boolean;
  joined(host: string, room: {id: string, path: string}, name: string): void;
};
const NO_NOTIFIER: LobbyNotifier = {canReach: () => false, joined: () => {}};

/** Creates the game exactly as the create form would (ApiCreateGame.createGame) */
export type GameStarter = (config: NewGameConfig) => Promise<StartedGame>;

type HumanSeat = {kind: 'human', participant: string, profile: LobbyProfile, ready: boolean, lastSeen: number};
// Entered by the host by hand; always counts as ready
// token: secret of the seat's own invitation link (lobby/room/<id>?seat=<token>), with which the player takes the
// seat over in the lobby; playerId: the player's link once the game runs. Both only ever go to the host.
type GuestSeat = {kind: 'guest', name: string, color: Color, handicap?: number, token?: string, playerId?: PlayerId};
type Seat = {kind: 'free'} | {kind: 'ai', aiLevel: AiLevel} | HumanSeat | GuestSeat;

type Room = {
  id: string;
  title: string;
  createdAt: number;
  listed: boolean;
  host: string;
  config: NewGameConfig;
  seats: Array<Seat>;
  state: 'open' | 'starting' | 'started';
  startedAt?: number;
  gameId?: GameId;
  spectatorId?: SpectatorId;
  /** Participant -> own player id once the game runs */
  playerIds: Record<string, PlayerId>;
  hostPlayerId?: PlayerId;
  /** Players besides the host who play themselves (joined in the lobby or entered by hand) */
  otherPlayerIds?: Array<PlayerId>;
  /** Somebody besides the host had the game open once: the game is no longer only the host's */
  joined?: boolean;
  /** Something happened beyond the initial choice: the game stays, whoever leaves */
  begun?: boolean;
  /** Participant -> how often the host removed them; from KICKS_BEFORE_REQUEST on joining becomes a request */
  removals?: Record<string, number>;
  /** Players removed more often who ask to come back; the host approves or declines */
  requests?: Array<JoinRequest>;
  /** Declined by the host: they can never join this game again */
  declined?: Array<string>;
};

type JoinRequest = {participant: string, profile: LobbyProfile, lastSeen: number};

/**
 * Open games waiting for players, kept in memory: a room only lives until its game starts
 * (or for a while afterwards as "running"); the game itself is stored like every other game.
 */
export class Lobby {
  public static readonly INSTANCE = new Lobby();
  private readonly rooms = new Map<string, Room>();
  private loaded = false;
  private notifier: LobbyNotifier = NO_NOTIFIER;
  /** Participant -> name of the game the host just removed them from; told once with the next list */
  private readonly removedFrom = new Map<string, string>();

  constructor(
    private readonly clock: () => number = Date.now,
    private readonly newId: () => string = randomRoomId,
    private readonly storage: LobbyStorage = fileStorage(),
  ) {}

  public setNotifier(notifier: LobbyNotifier): void {
    this.notifier = notifier;
  }

  /** Rooms of the last run, read on first use. Everybody gets a fresh heartbeat: the restart was not their fault */
  private ensureLoaded(): void {
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    const data = this.storage.load();
    if (!Array.isArray(data)) {
      return;
    }
    const now = this.clock();
    for (const room of data as Array<Room>) {
      if (typeof room?.id !== 'string' || !Array.isArray(room.seats)) {
        continue;
      }
      room.playerIds = room.playerIds ?? {};
      // A start interrupted by the restart is offered again
      if (room.state === 'starting') {
        room.state = 'open';
      }
      room.seats.forEach((seat) => {
        if (seat.kind === 'human') {
          seat.lastSeen = now;
        }
      });
      this.rooms.set(room.id, room);
    }
  }

  private save(): void {
    this.storage.save(Array.from(this.rooms.values()));
  }

  /**
   * Closes games whose creator left while they were still at the initial choice (corporation and
   * starting cards) and that nobody else ever opened. Presence is only known since watchingSince
   * (server start), so nobody counts as gone before ABANDONED_AFTER_MS after that.
   */
  public async closeAbandoned(probe: GameProbe, watchingSince: number): Promise<void> {
    this.ensureLoaded();
    const now = this.clock();
    for (const room of Array.from(this.rooms.values())) {
      const gameId = room.gameId;
      if (room.state !== 'started' || room.begun || room.joined || gameId === undefined || room.hostPlayerId === undefined) {
        continue;
      }
      if ((room.otherPlayerIds ?? []).some((id) => probe.isPresent(id))) {
        room.joined = true;
        this.save();
        continue;
      }
      if (probe.isPresent(room.hostPlayerId) || probe.isPresent(gameId)) {
        continue;
      }
      if (now - Math.max(room.startedAt ?? now, watchingSince) < ABANDONED_AFTER_MS) {
        continue;
      }
      const begun = await probe.hasBegun(gameId);
      if (begun === true) {
        room.begun = true;
        this.save();
        continue;
      }
      if (begun === false) {
        await probe.close(gameId);
      }
      this.forgetGame(gameId);
    }
  }

  /** The game of a room finished or was deleted: the room leaves the "running" list */
  public forgetGame(gameId: GameId): void {
    this.ensureLoaded();
    const rooms = Array.from(this.rooms.values()).filter((room) => room.gameId === gameId);
    rooms.forEach((room) => this.rooms.delete(room.id));
    if (rooms.length > 0) {
      this.save();
    }
  }

  /** The list with the progress of the running games (generation and terraforming come from the games themselves) */
  public async listWithProgress(me: string | undefined, roomId: string | undefined, progressOf: GameProgressSource): Promise<LobbyListModel> {
    const list = this.list(me, roomId);
    const now = this.clock();
    const rooms = await Promise.all(list.rooms.map(async (model) => {
      const room = this.rooms.get(model.id);
      if (room === undefined || room.state !== 'started' || room.gameId === undefined) {
        return model;
      }
      const status = await progressOf(room.gameId).catch(() => undefined);
      return status === undefined ? model : {...model, progress: {...status, playedMs: now - (room.startedAt ?? now)}};
    }));
    return {...list, rooms};
  }

  /** Rooms for the list: listed open and running ones, plus the room of the asking participant. Also the heartbeat. */
  public list(me: string | undefined, roomId?: string): LobbyListModel {
    this.ensureLoaded();
    this.prune();
    if (me !== undefined) {
      this.touch(me);
    }
    const yourRoom = me === undefined ? undefined : this.roomOf(me);
    const requested = me === undefined ? undefined : Array.from(this.rooms.values()).find((room) => room.state === 'open' && room.requests?.some((request) => request.participant === me));
    const rooms = Array.from(this.rooms.values())
      .filter((room) => room.listed || room === yourRoom || room === requested || room.id === roomId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((room) => this.model(room, me));
    const removedFrom = me === undefined ? undefined : this.removedFrom.get(me);
    if (me !== undefined) {
      this.removedFrom.delete(me);
    }
    return {rooms, yourRoomId: yourRoom?.id, requestedRoomId: requested?.id, removedFrom};
  }

  /**
   * Every game of the lobby page goes through here, also the ones without free seats (solo, only AI, everybody
   * entered by hand): those start right away and are listed as running when public.
   */
  public async open(me: string, profile: LobbyProfile, title: string, listed: boolean, config: NewGameConfig,
    starter: GameStarter, freeSeats?: ReadonlyArray<number>): Promise<LobbyRoomModel> {
    this.ensureLoaded();
    this.prune();
    const cleanProfile = sanitizeProfile(profile);
    const players = Array.isArray(config?.players) ? config.players : [];
    if (players.length < 1 || players.length > LOBBY_MAX_SEATS) {
      throw new LobbyError('A game needs 1 to 6 seats');
    }
    if (isAiLevel(players[0].aiLevel)) {
      throw new LobbyError('The first seat belongs to the host');
    }
    // Seat 0 is the host; AI players stay AI players; humans are free seats or guests entered by the host
    // Without a list every further human seat is offered in the lobby
    const free = new Set(Array.isArray(freeSeats) ? freeSeats : players.map((_, index) => index));
    const seats: Array<Seat> = players.map((player, index): Seat => {
      if (index === 0) {
        return this.humanSeat(me, cleanProfile, true);
      }
      if (isAiLevel(player.aiLevel)) {
        return {kind: 'ai', aiLevel: player.aiLevel};
      }
      if (free.has(index)) {
        return {kind: 'free'};
      }
      return this.guestSeat(player, []);
    });
    this.leaveAll(me);
    let id = this.newId();
    for (let attempt = 0; this.rooms.has(id) && attempt < 50; attempt++) {
      id = this.newId();
    }
    const room: Room = {
      id,
      title: sanitizeTitle(title) || sanitizeTitle(config.name) || defaultTitle(cleanProfile.name),
      createdAt: this.clock(),
      listed: listed !== false,
      host: me,
      config: {...config, clonedGamedId: undefined},
      seats,
      state: 'open',
      playerIds: {},
    };
    this.rooms.set(room.id, room);
    this.save();
    try {
      await this.startIfComplete(room, starter);
    } catch (error) {
      // Not startable (e.g. settings the AI cannot handle): no half room stays behind
      this.rooms.delete(room.id);
      this.save();
      throw error;
    }
    return this.model(room, me);
  }

  /**
   * seatToken: the invitation link of a seat the host entered by hand; whoever opens it takes that very seat
   * (in the color the host chose, if still free), otherwise the first free seat.
   */
  public async join(me: string, profile: LobbyProfile, roomId: string, starter: GameStarter, seatToken?: string): Promise<LobbyRoomModel> {
    this.ensureLoaded();
    this.prune();
    const room = this.openRoom(roomId);
    const cleanProfile = sanitizeProfile(profile);
    if (room.declined?.includes(me)) {
      throw new LobbyError('The host declined your request: you cannot join this game.');
    }
    if (this.seatIndexOf(room, me) < 0 && (room.removals?.[me] ?? 0) >= KICKS_BEFORE_REQUEST) {
      // Removed twice: only the host lets them back in (approveRequest)
      room.requests = (room.requests ?? []).filter((request) => request.participant !== me);
      room.requests.push({participant: me, profile: cleanProfile, lastSeen: this.clock()});
      this.save();
      return this.model(room, me);
    }
    const reserved = seatToken === undefined ? -1 : room.seats.findIndex((seat) => seat.kind === 'guest' && seat.token === seatToken);
    if (this.seatIndexOf(room, me) < 0 && reserved >= 0) {
      const guest = room.seats[reserved] as GuestSeat;
      this.leaveAll(me);
      room.seats[reserved] = {kind: 'free'};
      const color = this.freeColor(room, guest.color);
      room.seats[reserved] = this.humanSeat(me, {...cleanProfile, color}, true);
      this.save();
      this.notifier.joined(room.host, {id: room.id, path: lobbyRoomPath(room.id, room.title)}, cleanProfile.name);
    } else if (this.seatIndexOf(room, me) < 0) {
      const free = room.seats.findIndex((seat) => seat.kind === 'free');
      if (free < 0) {
        throw new LobbyError('This game is already full');
      }
      this.leaveAll(me);
      // Preferred color if nobody else has it, otherwise the first free one
      const color = this.freeColor(room, cleanProfile.color);
      // Joining is a deliberate click: the seat is ready right away (can be taken back in the waiting room)
      room.seats[free] = this.humanSeat(me, {...cleanProfile, color}, true);
      this.save();
      this.notifier.joined(room.host, {id: room.id, path: lobbyRoomPath(room.id, room.title)}, cleanProfile.name);
    }
    await this.startIfComplete(room, starter);
    return this.model(room, me);
  }

  /** Name, picture or color changed while waiting */
  public updateProfile(me: string, profile: LobbyProfile, roomId: string): LobbyRoomModel {
    const room = this.openRoom(roomId);
    const seat = this.humanSeatOf(room, me);
    const cleanProfile = sanitizeProfile(profile);
    seat.profile = {...cleanProfile, color: this.freeColor(room, cleanProfile.color, me)};
    this.save();
    return this.model(room, me);
  }

  public leave(me: string, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room === undefined || room.state !== 'open') {
      return;
    }
    if (room.requests?.some((request) => request.participant === me)) {
      room.requests = room.requests.filter((request) => request.participant !== me);
      this.save();
      return;
    }
    this.removeParticipant(room, me);
    this.save();
  }

  public async setReady(me: string, roomId: string, ready: boolean, starter: GameStarter): Promise<LobbyRoomModel> {
    const room = this.openRoom(roomId);
    this.humanSeatOf(room, me).ready = ready === true;
    this.save();
    await this.startIfComplete(room, starter);
    return this.model(room, me);
  }

  /** Host only: a free seat becomes an AI player */
  public async seatAi(me: string, roomId: string, seatIndex: number, starter: GameStarter): Promise<LobbyRoomModel> {
    const room = this.hostRoom(me, roomId);
    if (room.seats[seatIndex]?.kind !== 'free') {
      throw new LobbyError('This seat is not free');
    }
    this.assertAiPossible(room);
    this.analysisWithFirstAi(room);
    room.seats[seatIndex] = {kind: 'ai', aiLevel: DEFAULT_AI_LEVEL};
    this.save();
    await this.startIfComplete(room, starter);
    return this.model(room, me);
  }

  /**
   * Host only, while waiting: the seat becomes free again (AI player, player entered by hand or somebody who joined).
   * Whoever joined is told (list: removedFrom) and counted; from the second time on, coming back needs the host's approval.
   */
  public removeSeat(me: string, roomId: string, seatIndex: number): LobbyRoomModel {
    const room = this.hostRoom(me, roomId);
    const seat = room.seats[seatIndex];
    if (seatIndex === 0 || seat === undefined || seat.kind === 'free') {
      throw new LobbyError('This seat cannot be removed');
    }
    if (seat.kind === 'human') {
      room.removals = {...room.removals, [seat.participant]: (room.removals?.[seat.participant] ?? 0) + 1};
      this.removedFrom.set(seat.participant, room.title);
    }
    room.seats[seatIndex] = {kind: 'free'};
    this.save();
    return this.model(room, me);
  }

  /** Host only: a player removed twice before takes the first free seat */
  public async approveRequest(me: string, roomId: string, participant: string, starter: GameStarter): Promise<LobbyRoomModel> {
    const room = this.hostRoom(me, roomId);
    const request = room.requests?.find((candidate) => candidate.participant === participant);
    if (request === undefined) {
      throw new LobbyError('This request no longer exists');
    }
    const free = room.seats.findIndex((seat) => seat.kind === 'free');
    if (free < 0) {
      throw new LobbyError('There is no free seat for this player.');
    }
    this.leaveAll(participant);
    room.requests = room.requests?.filter((candidate) => candidate !== request);
    room.seats[free] = this.humanSeat(participant, {...request.profile, color: this.freeColor(room, request.profile.color)}, true);
    this.save();
    await this.startIfComplete(room, starter);
    return this.model(room, me);
  }

  /** Host only: the player can never join this game again */
  public declineRequest(me: string, roomId: string, participant: string): LobbyRoomModel {
    const room = this.hostRoom(me, roomId);
    room.requests = room.requests?.filter((candidate) => candidate.participant !== participant);
    room.declined = [...(room.declined ?? []), participant];
    this.save();
    return this.model(room, me);
  }

  /** Host only, while waiting: strength of a seated AI player */
  public setAiLevel(me: string, roomId: string, seatIndex: number, aiLevel: unknown): LobbyRoomModel {
    const room = this.hostRoom(me, roomId);
    const seat = room.seats[seatIndex];
    if (seat?.kind !== 'ai' || !isAiLevel(aiLevel)) {
      throw new LobbyError('This seat is not an AI player');
    }
    seat.aiLevel = aiLevel;
    this.save();
    return this.model(room, me);
  }

  /**
   * The first AI player seated in the waiting room makes it an analysis game, like switching on AI players in the
   * create form (AI_ANALYSIS_DEFAULT). Once AI players are there, the host's own choice stays.
   */
  private analysisWithFirstAi(room: Room): void {
    if (!room.seats.some((seat) => seat.kind === 'ai')) {
      room.config = {...room.config, aiAnalysis: AI_ANALYSIS_DEFAULT};
    }
  }

  /**
   * Host only, while waiting: new settings from the create form. Seats are laid out as in open(); players who
   * already joined keep their place on the free seats of the new layout, so there must be enough of them.
   * Nothing starts here: the changed game waits until somebody confirms (ready) or the host starts it.
   */
  public edit(me: string, roomId: string, title: string, listed: boolean, config: NewGameConfig, freeSeats: ReadonlyArray<number>): LobbyRoomModel {
    const room = this.hostRoom(me, roomId);
    const players = Array.isArray(config?.players) ? config.players : [];
    if (players.length < 1 || players.length > LOBBY_MAX_SEATS) {
      throw new LobbyError('A game needs 1 to 6 seats');
    }
    if (isAiLevel(players[0].aiLevel)) {
      throw new LobbyError('The first seat belongs to the host');
    }
    const host = room.seats[0];
    const oldGuests = room.seats.filter((seat): seat is GuestSeat => seat.kind === 'guest');
    const joined = room.seats.filter((seat, index): seat is HumanSeat => index > 0 && seat.kind === 'human');
    const free = new Set(Array.isArray(freeSeats) ? freeSeats : []);
    const seats = players.map((player, index): Seat => {
      if (index === 0) {
        return host;
      }
      if (isAiLevel(player.aiLevel)) {
        return {kind: 'ai', aiLevel: player.aiLevel};
      }
      if (free.has(index)) {
        return joined.shift() ?? {kind: 'free'};
      }
      return this.guestSeat(player, oldGuests);
    });
    if (joined.length > 0) {
      throw new LobbyError('Players have already joined: keep a free seat for each of them.');
    }
    room.seats = seats;
    room.config = {...config, clonedGamedId: undefined};
    room.title = sanitizeTitle(title) || sanitizeTitle(config.name) || room.title;
    room.listed = listed !== false;
    this.save();
    return this.model(room, me);
  }

  /** A player entered by the host; an unchanged guest of the previous layout keeps the link already sent */
  private guestSeat(player: NewPlayerModel, previous: ReadonlyArray<GuestSeat>): GuestSeat {
    const guest = sanitizeProfile({name: player.name || capitalize(player.color), color: player.color, emoji: ''});
    const same = previous.find((seat) => seat.name === guest.name);
    return {kind: 'guest', name: guest.name, color: guest.color, handicap: Number(player.handicap) || 0, token: same?.token ?? randomSeatToken()};
  }

  /** No AI seat for settings the AI cannot handle (same check as the create form and ApiCreateGame, aiSupport.ts) */
  private assertAiPossible(room: Room): void {
    if (aiUnsupportedReasons({expansions: room.config.expansions, twoCorpsVariant: room.config.twoCorpsVariant}).length > 0) {
      throw new LobbyError('AI players are not available with these settings.');
    }
  }

  /** Host only: every free seat becomes an AI player and the game starts */
  public async fillWithAi(me: string, roomId: string, starter: GameStarter): Promise<LobbyRoomModel> {
    const room = this.hostRoom(me, roomId);
    this.assertAiPossible(room);
    if (room.seats.some((seat) => seat.kind === 'free')) {
      this.analysisWithFirstAi(room);
    }
    room.seats = room.seats.map((seat) => seat.kind === 'free' ? {kind: 'ai', aiLevel: DEFAULT_AI_LEVEL} : seat);
    this.save();
    await this.start(room, starter);
    return this.model(room, me);
  }

  /**
   * Host only, at any time: start with everybody seated, even if not everyone pressed "Ready". Free seats are left
   * out: a game set up for 4 starts with the 3 who came; the host alone plays a solo game.
   */
  public async startNow(me: string, roomId: string, starter: GameStarter): Promise<LobbyRoomModel> {
    const room = this.hostRoom(me, roomId);
    room.seats = room.seats.filter((seat) => seat.kind !== 'free');
    await this.start(room, starter);
    return this.model(room, me);
  }

  private async startIfComplete(room: Room, starter: GameStarter): Promise<void> {
    const complete = room.seats.every((seat) => seat.kind === 'ai' || seat.kind === 'guest' || (seat.kind === 'human' && seat.ready));
    if (complete) {
      await this.start(room, starter);
    }
  }

  private async start(room: Room, starter: GameStarter): Promise<void> {
    if (room.state !== 'open') {
      return;
    }
    // While the game is being created, no second request may start it again
    room.state = 'starting';
    try {
      const config = this.gameConfig(room);
      const game = await starter(config);
      room.gameId = game.id;
      room.spectatorId = game.spectatorId;
      const otherPlayerIds: Array<PlayerId> = [];
      room.seats.forEach((seat, index) => {
        const playerId = game.players[index].id;
        if (seat.kind === 'human') {
          room.playerIds[seat.participant] = playerId;
        }
        if (seat.kind === 'guest') {
          seat.playerId = playerId;
        }
        if (seat.kind === 'human' && seat.participant === room.host) {
          room.hostPlayerId = playerId;
        } else if (seat.kind === 'human' || seat.kind === 'guest') {
          otherPlayerIds.push(playerId);
        }
      });
      room.otherPlayerIds = otherPlayerIds;
      room.state = 'started';
      room.startedAt = this.clock();
      this.save();
    } catch (error) {
      room.state = 'open';
      throw error;
    }
  }

  /** The create form's settings with the seated players, in seat order */
  private gameConfig(room: Room): NewGameConfig {
    const humanColors = new Set(room.seats.flatMap((seat) => seat.kind === 'human' ? [seat.profile.color] : seat.kind === 'guest' ? [seat.color] : []));
    const freeColors = PLAYER_COLORS.filter((color) => !humanColors.has(color));
    const players: Array<NewPlayerModel> = room.seats.map((seat) => {
      // TR boost as set in the form (host and players entered by hand); joining players start without
      if (seat.kind === 'human') {
        const handicap = seat.participant === room.host ? Number(room.config.players[0]?.handicap) || 0 : 0;
        return {name: seat.profile.name, color: seat.profile.color, beginner: false, handicap, first: false};
      }
      if (seat.kind === 'guest') {
        return {name: seat.name, color: seat.color, beginner: false, handicap: seat.handicap ?? 0, first: false};
      }
      const color = freeColors.shift() as Color;
      const aiLevel = seat.kind === 'ai' ? seat.aiLevel : DEFAULT_AI_LEVEL;
      return {name: capitalize(color), color, beginner: false, handicap: 0, first: false, aiLevel};
    });
    // Seat order is the form's order, so its "goes first" star still points at the right seat
    const chosenFirst = room.config.players.findIndex((player) => player.first === true);
    const firstIndex = room.config.randomFirstPlayer ? Math.floor(Math.random() * players.length) : Math.max(0, chosenFirst);
    players[firstIndex].first = true;
    return {...room.config, name: room.title, players, clonedGamedId: undefined};
  }

  private model(room: Room, me: string | undefined): LobbyRoomModel {
    const seats = room.seats.map((seat): LobbySeatModel => {
      if (seat.kind === 'guest') {
        // Only the host may pass on a guest's link: waiting, the seat's invitation; running, the player page
        const forHost = me === room.host;
        return {kind: 'guest', name: seat.name, color: seat.color,
          inviteToken: forHost && room.state === 'open' ? seat.token : undefined,
          playerId: forHost && room.state === 'started' ? seat.playerId : undefined};
      }
      if (seat.kind !== 'human') {
        return seat.kind === 'ai' ? {kind: 'ai', aiLevel: seat.aiLevel} : {kind: 'free'};
      }
      return {
        kind: 'human',
        name: seat.profile.name,
        color: seat.profile.color,
        emoji: seat.profile.emoji,
        image: seat.profile.image,
        ready: seat.ready,
        host: seat.participant === room.host,
        you: seat.participant === me,
      };
    });
    const config = room.config;
    return {
      id: room.id,
      title: room.title,
      ageMs: this.clock() - room.createdAt,
      state: room.state === 'started' ? 'started' : 'open',
      listed: room.listed,
      seats,
      setup: {
        expansions: config.expansions,
        boards: config.boards ?? [],
        randomBoard: (config.boards ?? []).length > 1,
        options: setupOptionsFromConfig(config),
      },
      gameId: me === room.host ? room.gameId : undefined,
      config: me === room.host && room.state === 'open' ? room.config : undefined,
      requests: me === room.host && room.state === 'open' && (room.requests?.length ?? 0) > 0 ?
        room.requests?.map((request) => ({participant: request.participant, name: request.profile.name, color: request.profile.color, emoji: request.profile.emoji, image: request.profile.image})) :
        undefined,
      spectatorId: room.spectatorId,
      yourPlayerId: me === undefined ? undefined : room.playerIds[me],
      hostNeedsLinks: room.state === 'started' && me === room.host && room.seats.some((seat) => seat.kind === 'guest') ? true : undefined,
    };
  }

  private touch(me: string): void {
    const now = this.clock();
    for (const room of this.rooms.values()) {
      for (const seat of room.seats) {
        if (seat.kind === 'human' && seat.participant === me) {
          seat.lastSeen = now;
        }
      }
      for (const request of room.requests ?? []) {
        if (request.participant === me) {
          request.lastSeen = now;
        }
      }
    }
  }

  /** Drops participants who stopped polling, rooms without host and rooms that are too old */
  private prune(): void {
    const before = JSON.stringify(Array.from(this.rooms.keys())) + this.seatSignature();
    this.pruneRooms();
    if (JSON.stringify(Array.from(this.rooms.keys())) + this.seatSignature() !== before) {
      this.save();
    }
  }

  private seatSignature(): string {
    return Array.from(this.rooms.values()).map((room) => room.seats.map((seat) => seat.kind).join()).join('|');
  }

  private pruneRooms(): void {
    const now = this.clock();
    for (const room of Array.from(this.rooms.values())) {
      if (room.state === 'started') {
        if (now - (room.startedAt ?? now) > STARTED_ROOM_MAX_AGE_MS) {
          this.rooms.delete(room.id);
        }
        continue;
      }
      if (room.state !== 'open') {
        continue;
      }
      if (now - room.createdAt > OPEN_ROOM_MAX_AGE_MS) {
        this.rooms.delete(room.id);
        continue;
      }
      for (const seat of room.seats) {
        if (seat.kind === 'human' && now - seat.lastSeen > this.timeoutOf(room, seat.participant)) {
          this.removeParticipant(room, seat.participant);
        }
      }
      // A request whose player closed the lobby is withdrawn
      room.requests = room.requests?.filter((request) => now - request.lastSeen <= PARTICIPANT_TIMEOUT_MS);
    }
  }

  // The host may close the tab and wait for the push message; everybody else must keep the lobby open
  private timeoutOf(room: Room, participant: string): number {
    return participant === room.host && this.notifier.canReach(participant) ? REACHABLE_HOST_TIMEOUT_MS : PARTICIPANT_TIMEOUT_MS;
  }

  /** The host leaving dissolves the room; anybody else frees the seat */
  private removeParticipant(room: Room, participant: string): void {
    if (participant === room.host) {
      this.rooms.delete(room.id);
      return;
    }
    // (saved by the caller)
    const index = this.seatIndexOf(room, participant);
    if (index >= 0) {
      room.seats[index] = {kind: 'free'};
    }
  }

  private leaveAll(me: string): void {
    for (const room of Array.from(this.rooms.values())) {
      if (room.state === 'open' && this.seatIndexOf(room, me) >= 0) {
        this.removeParticipant(room, me);
        this.save();
      }
    }
  }

  private roomOf(me: string): Room | undefined {
    const rooms = Array.from(this.rooms.values()).filter((room) => this.seatIndexOf(room, me) >= 0);
    // An open room counts before a game that already runs
    return rooms.find((room) => room.state !== 'started') ?? rooms.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];
  }

  private seatIndexOf(room: Room, me: string): number {
    return room.seats.findIndex((seat) => seat.kind === 'human' && seat.participant === me);
  }

  private humanSeatOf(room: Room, me: string): HumanSeat {
    const seat = room.seats[this.seatIndexOf(room, me)];
    if (seat === undefined || seat.kind !== 'human') {
      throw new LobbyError('You are not part of this game');
    }
    return seat;
  }

  private openRoom(roomId: string): Room {
    this.ensureLoaded();
    const room = this.rooms.get(roomId);
    if (room === undefined) {
      throw new LobbyError('This game no longer exists. The host may have closed it.');
    }
    if (room.state !== 'open') {
      throw new LobbyError('This game has already started');
    }
    return room;
  }

  private hostRoom(me: string, roomId: string): Room {
    const room = this.openRoom(roomId);
    if (room.host !== me) {
      throw new LobbyError('Only the host can do this');
    }
    return room;
  }

  private humanSeat(me: string, profile: LobbyProfile, ready: boolean): HumanSeat {
    return {kind: 'human', participant: me, profile, ready, lastSeen: this.clock()};
  }

  private freeColor(room: Room, preferred: Color, except?: string): Color {
    const taken = new Set(room.seats.flatMap((seat) => {
      if (seat.kind === 'guest') {
        return [seat.color];
      }
      return seat.kind === 'human' && seat.participant !== except ? [seat.profile.color] : [];
    }));
    return taken.has(preferred) ? (PLAYER_COLORS.find((color) => !taken.has(color)) ?? preferred) : preferred;
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// The client always sends a (translated) title; only a direct API call falls back to the host's name
function defaultTitle(name: string): string {
  return name;
}

// 4 characters (lobbyUrl.ts): short enough for a readable link; the lobby checks for collisions
/** Secret of a guest seat's invitation link: long enough not to be guessed from the room link */
function randomSeatToken(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: 12}, () => characters[Math.floor(Math.random() * characters.length)]).join('');
}

function randomRoomId(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: 4}, () => characters[Math.floor(Math.random() * characters.length)]).join('');
}
