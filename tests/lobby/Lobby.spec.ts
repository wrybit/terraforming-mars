import {expect} from 'chai';
import {ABANDONED_AFTER_MS, GameProbe, GameStarter, Lobby, PARTICIPANT_TIMEOUT_MS, REACHABLE_TIMEOUT_MS, StartedGame} from '../../src/server/lobby/Lobby';
import {LobbyError} from '../../src/server/lobby/lobbyValidation';
import {NewGameConfig} from '../../src/common/game/NewGameConfig';
import {LobbyProfile} from '../../src/common/lobby/LobbyModel';
import {memoryStorage} from '../../src/server/lobby/lobbyStorage';
import {isLobbyCreatePath, lobbyRoomIdFromPath, lobbyRoomPath} from '../../src/common/lobby/lobbyUrl';

const HOST = 'hosthosthosthost01';
const GUEST = 'guestguestguest001';
const OTHER = 'otherotherother001';

function profile(name: string, color: LobbyProfile['color'] = 'red'): LobbyProfile {
  return {name, color, emoji: '🚀'};
}

// Only the parts the lobby reads; the rest belongs to ApiCreateGame
function config(seats: Array<'human' | 'ai'>): NewGameConfig {
  return {
    players: seats.map((kind, index) => ({name: '', color: 'red', beginner: false, handicap: 0, first: index === 0, aiLevel: kind === 'ai' ? 'hard' : undefined})),
    expansions: {corpera: true, prelude: true} as NewGameConfig['expansions'],
    boards: ['tharsis'],
    randomFirstPlayer: false,
    customCorporationsList: [], customPreludes: [], customCeos: [], customColoniesList: [], bannedCards: [], includedCards: [],
  } as unknown as NewGameConfig;
}

describe('Lobby', () => {
  let now: number;
  let lobby: Lobby;
  let started: Array<NewGameConfig>;
  let storage: ReturnType<typeof memoryStorage>;
  const starter: GameStarter = async (gameConfig) => {
    started.push(gameConfig);
    const game: StartedGame = {id: 'g1', spectatorId: 's1', players: gameConfig.players.map((_, index) => ({id: `p${index}` as const}))};
    return game;
  };

  beforeEach(() => {
    now = 1_000_000;
    started = [];
    let next = 0;
    storage = memoryStorage();
    lobby = new Lobby(() => now, () => 'room' + (next++), storage);
  });

  it('opens a room with the host, free seats and AI seats', async () => {
    const room = await lobby.open(HOST, profile('Ann'), 'Evening game', true, config(['human', 'human', 'ai']), starter);
    expect(room.title).eq('Evening game');
    expect(room.seats.map((seat) => seat.kind)).deep.eq(['human', 'free', 'ai']);
    expect(room.seats[0]).to.include({host: true, you: true, name: 'Ann'});
  });

  it('starts a game without free seats right away and lists it as running', async () => {
    const room = await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'ai']), starter);
    expect(room.state).eq('started');
    expect(started[0].players.map((p) => p.name)).deep.eq(['Ann', 'Green']);
    expect(lobby.list(OTHER).rooms[0].state).eq('started');
  });

  it('keeps a running game listed until it ends', async () => {
    await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'ai']), starter);
    now += 7 * 24 * 60 * 60 * 1000;
    expect(lobby.list(OTHER).rooms).has.length(1);
    lobby.forgetGame('g1');
    expect(lobby.list(OTHER).rooms).is.empty;
  });

  describe('closes abandoned games', () => {
    let present: Set<string>;
    let begun: boolean | undefined;
    let closed: Array<string>;
    const probe: GameProbe = {
      isPresent: (id) => present.has(id),
      hasBegun: () => Promise.resolve(begun),
      close: (gameId) => {
        closed.push(gameId);
        return Promise.resolve();
      },
    };

    beforeEach(async () => {
      present = new Set();
      begun = false;
      closed = [];
      // Host p0 with an AI: starts right away
      await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'ai']), starter);
    });

    it('closes the game once the creator is gone long enough', async () => {
      now += ABANDONED_AFTER_MS - 1;
      await lobby.closeAbandoned(probe, 0);
      expect(closed).is.empty;
      now += 1;
      await lobby.closeAbandoned(probe, 0);
      expect(closed).deep.eq(['g1']);
      expect(lobby.list(OTHER).rooms).is.empty;
    });

    it('keeps it while the creator is there, after a restart and once it began', async () => {
      now += ABANDONED_AFTER_MS;
      present.add('p0');
      await lobby.closeAbandoned(probe, 0);
      present.clear();
      await lobby.closeAbandoned(probe, now);
      expect(closed).is.empty;
      begun = true;
      await lobby.closeAbandoned(probe, 0);
      begun = false;
      await lobby.closeAbandoned(probe, 0);
      expect(closed).is.empty;
      expect(lobby.list(OTHER).rooms).has.length(1);
    });

    it('keeps it while the creator has the lobby open (room dialog with the players\' links)', async () => {
      now += ABANDONED_AFTER_MS;
      lobby.list(HOST);
      await lobby.closeAbandoned(probe, 0);
      expect(closed).is.empty;
    });
  });

  it('keeps a game somebody else joined', async () => {
    const closed: Array<string> = [];
    let present = ['p1'];
    const probe: GameProbe = {isPresent: (id) => present.includes(id), hasBegun: () => Promise.resolve(false), close: (gameId) => {
      closed.push(gameId);
      return Promise.resolve();
    }};
    const room = await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human']), starter);
    await lobby.join(GUEST, profile('Bob'), room.id, starter);
    await lobby.closeAbandoned(probe, 0);
    present = [];
    now += ABANDONED_AFTER_MS;
    await lobby.closeAbandoned(probe, 0);
    expect(closed).is.empty;
  });

  it('refuses AI seats for settings the AI cannot handle', async () => {
    const withColonies = config(['human', 'human']);
    withColonies.expansions = {...withColonies.expansions, colonies: true};
    const room = await lobby.open(HOST, profile('Ann'), '', true, withColonies, starter);
    for (const action of [() => lobby.seatAi(HOST, room.id, 1, starter), () => lobby.fillWithAi(HOST, room.id, starter)]) {
      try {
        await action();
        expect.fail('AI seat accepted');
      } catch (error) {
        expect(error).instanceOf(LobbyError);
      }
    }
    expect(lobby.list(HOST).rooms[0].seats.map((seat) => seat.kind)).deep.eq(['human', 'free']);
  });

  it('adds the progress of running games to the list', async () => {
    await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'ai']), starter);
    now += 90_000;
    const list = await lobby.listWithProgress(OTHER, undefined, () => Promise.resolve({generation: 4, terraforming: 0.25}));
    expect(list.rooms[0].progress).deep.eq({generation: 4, terraforming: 0.25, playedMs: 90_000});
  });

  it('turns the last human move of a running game into the time since then', async () => {
    await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'ai']), starter);
    const lastMove = now + 30_000;
    now += 90_000;
    const list = await lobby.listWithProgress(OTHER, undefined, () => Promise.resolve({generation: 4, terraforming: 0.25, lastActivityTimeMs: lastMove}));
    expect(list.rooms[0].progress).deep.eq({generation: 4, terraforming: 0.25, playedMs: 90_000, idleMs: 60_000});
  });

  it('drops a room whose game cannot be created', async () => {
    const failing: GameStarter = () => Promise.reject(new LobbyError('no'));
    try {
      await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'ai']), failing);
      expect.fail('opened');
    } catch (error) {
      expect(error).instanceOf(LobbyError);
    }
    expect(lobby.list(HOST).rooms).has.length(0);
  });

  it('starts the game once the last seat is taken, in seat order', async () => {
    const room = await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'ai']), starter);
    const joined = await lobby.join(GUEST, profile('Bob'), room.id, starter);
    expect(joined.state).eq('started');
    expect(joined.yourPlayerId).eq('p1');
    expect(started[0].players.map((p) => p.name)).deep.eq(['Ann', 'Bob', 'Yellow']); // Bob also wanted red: green; the AI takes the next free color
    expect(started[0].players.map((p) => p.first)).deep.eq([true, false, false]);
    expect(started[0].players[2].aiLevel).eq('hard');
    expect(lobby.list(HOST).rooms[0].yourPlayerId).eq('p0');
  });

  it('keeps the color and name chosen for an AI in the create form', async () => {
    const gameConfig = config(['human', 'ai', 'ai']);
    gameConfig.players[1].color = 'yellow';
    gameConfig.players[2].color = 'blue';
    gameConfig.players[2].name = 'Robo';
    await lobby.open(HOST, profile('Ann'), '', true, gameConfig, starter);
    expect(started[0].players.map((p) => p.color)).deep.eq(['red', 'yellow', 'blue']);
    expect(started[0].players.map((p) => p.name)).deep.eq(['Ann', 'Yellow', 'Robo']);
  });

  it('gives an AI another color when a human took its color', async () => {
    const gameConfig = config(['human', 'human', 'ai']);
    gameConfig.players[2].color = 'yellow';
    const room = await lobby.open(HOST, profile('Ann'), '', true, gameConfig, starter);
    await lobby.join(GUEST, profile('Bob', 'yellow'), room.id, starter);
    expect(started[0].players.map((p) => p.color)).deep.eq(['red', 'yellow', 'green']);
  });

  it('gives a joining player a free color when the preferred one is taken', async () => {
    const room = await lobby.open(HOST, profile('Ann', 'red'), '', true, config(['human', 'human', 'human']), starter);
    const joined = await lobby.join(GUEST, profile('Bob', 'red'), room.id, starter);
    const bob = joined.seats[1];
    expect(bob.kind === 'human' && bob.color).not.eq('red');
  });

  it('waits for everybody to be ready', async () => {
    const room = await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'human']), starter);
    await lobby.join(GUEST, profile('Bob'), room.id, starter);
    await lobby.setReady(GUEST, room.id, false, starter);
    await lobby.join(OTHER, profile('Cid'), room.id, starter);
    expect(started).has.length(0);
    const ready = await lobby.setReady(GUEST, room.id, true, starter);
    expect(ready.state).eq('started');
  });

  it('lets only the host fill the free seats with AI players and start', async () => {
    const room = await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'human']), starter);
    await lobby.join(GUEST, profile('Bob'), room.id, starter);
    await lobby.setReady(GUEST, room.id, false, starter);
    try {
      await lobby.fillWithAi(GUEST, room.id, starter);
      expect.fail('a guest filled the seats');
    } catch (error) {
      expect(error).instanceOf(LobbyError);
    }
    const filled = await lobby.fillWithAi(HOST, room.id, starter);
    expect(filled.state).eq('started');
    expect(filled.seats.map((seat) => seat.kind)).deep.eq(['human', 'human', 'ai']);
  });

  it('lets the host free any seat; who was removed twice has to ask, declined ones stay out', async () => {
    const room = await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'ai', 'human']), starter);
    expect(lobby.removeSeat(HOST, room.id, 2).seats[2].kind).eq('free');
    try {
      lobby.removeSeat(GUEST, room.id, 1);
      expect.fail('a guest removed a seat');
    } catch (error) {
      expect(error).instanceOf(LobbyError);
    }
    for (let round = 1; round <= 2; round++) {
      await lobby.join(GUEST, profile('Bob', 'blue'), room.id, starter);
      lobby.removeSeat(HOST, room.id, 1);
      expect(lobby.list(GUEST).removedFrom).eq(room.title);
      // Told once
      expect(lobby.list(GUEST).removedFrom).is.undefined;
    }
    expect(lobby.list(GUEST).rooms[0].yourAccess).eq('request');
    // Third time: a request instead of a seat
    const asked = await lobby.join(GUEST, profile('Bob', 'blue'), room.id, starter);
    expect(asked.seats.filter((seat) => seat.kind === 'human')).has.length(1);
    expect(lobby.list(GUEST).requestedRoomId).eq(room.id);
    expect(lobby.list(HOST).rooms[0].requests?.map((request) => request.name)).deep.eq(['Bob']);
    expect(lobby.list(OTHER).rooms[0].requests).is.undefined;
    await lobby.approveRequest(HOST, room.id, GUEST, starter);
    expect(lobby.list(GUEST).yourRoomId).eq(room.id);
    lobby.removeSeat(HOST, room.id, 1);
    await lobby.join(GUEST, profile('Bob', 'blue'), room.id, starter);
    lobby.declineRequest(HOST, room.id, GUEST);
    const declined = lobby.list(GUEST);
    expect(declined.declinedFrom).eq(room.title);
    expect(declined.rooms[0].yourAccess).eq('declined');
    try {
      await lobby.join(GUEST, profile('Bob', 'blue'), room.id, starter);
      expect.fail('a declined player joined');
    } catch (error) {
      expect(error).instanceOf(LobbyError);
    }
    // Somebody else still joins directly
    expect((await lobby.join(OTHER, profile('Cid', 'green'), room.id, starter)).seats.filter((seat) => seat.kind === 'human')).has.length(2);
  });

  it('lets only the host change the strength of an AI player while waiting', async () => {
    const room = await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'ai']), starter);
    try {
      lobby.setAiLevel(GUEST, room.id, 2, 'easy');
      expect.fail('a guest changed the AI');
    } catch (error) {
      expect(error).instanceOf(LobbyError);
    }
    try {
      lobby.setAiLevel(HOST, room.id, 1, 'easy');
      expect.fail('a free seat got a strength');
    } catch (error) {
      expect(error).instanceOf(LobbyError);
    }
    expect(lobby.setAiLevel(HOST, room.id, 2, 'easy').seats[2]).deep.eq({kind: 'ai', aiLevel: 'easy'});
    await lobby.startNow(HOST, room.id, starter);
    expect(started[0].players[1].aiLevel).eq('easy');
  });

  it('turns on the analysis game when the first AI player is seated in the waiting room', async () => {
    const room = await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'human']), starter);
    await lobby.seatAi(HOST, room.id, 2, starter);
    await lobby.fillWithAi(HOST, room.id, starter);
    expect(started[0].aiAnalysis).is.true;
  });

  it('keeps the choice of the host once AI players are there', async () => {
    const withAi = {...config(['human', 'human', 'ai']), aiAnalysis: false};
    const room = await lobby.open(HOST, profile('Ann'), '', true, withAi, starter);
    await lobby.fillWithAi(HOST, room.id, starter);
    expect(started[0].aiAnalysis).is.false;
  });

  it('lets the host change a waiting game; joined players keep a free seat', async () => {
    const room = await lobby.open(HOST, profile('Ann'), 'Evening', true, config(['human', 'human', 'human']), starter);
    await lobby.join(GUEST, profile('Bob', 'blue'), room.id, starter);
    expect(lobby.list(HOST).rooms[0].config?.players).has.length(3);
    expect(lobby.list(GUEST).rooms[0].config).is.undefined;
    try {
      lobby.edit(GUEST, room.id, 'Mine', true, config(['human', 'human']), [1]);
      expect.fail('a guest changed the game');
    } catch (error) {
      expect(error).instanceOf(LobbyError);
    }
    try {
      lobby.edit(HOST, room.id, 'Late', true, config(['human', 'ai']), []);
      expect.fail('the joined player lost the seat');
    } catch (error) {
      expect(error).instanceOf(LobbyError);
    }
    const changed = lobby.edit(HOST, room.id, 'Late', false, config(['human', 'human', 'human', 'ai']), [1, 2]);
    expect(changed.title).eq('Late');
    expect(changed.listed).is.false;
    expect(changed.seats.map((seat) => seat.kind)).deep.eq(['human', 'human', 'free', 'ai']);
    expect(changed.seats[1]).to.include({name: 'Bob'});
    expect(changed.state).eq('open');
  });

  it('lets the host start at any time with the free seats left out, alone as a solo game', async () => {
    const room = await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'human', 'human']), starter);
    await lobby.join(GUEST, profile('Bob', 'blue'), room.id, starter);
    await lobby.join(OTHER, profile('Cid', 'green'), room.id, starter);
    try {
      await lobby.startNow(GUEST, room.id, starter);
      expect.fail('a guest started the game');
    } catch (error) {
      expect(error).instanceOf(LobbyError);
    }
    const startedRoom = await lobby.startNow(HOST, room.id, starter);
    expect(startedRoom.state).eq('started');
    expect(startedRoom.seats.map((seat) => seat.kind)).deep.eq(['human', 'human', 'human']);
    expect(started[0].players.map((player) => player.name)).deep.eq(['Ann', 'Bob', 'Cid']);

    const alone = await lobby.open(OTHER, profile('Cid'), '', true, config(['human', 'human']), starter);
    expect((await lobby.startNow(OTHER, alone.id, starter)).seats).has.length(1);
    expect(started[1].players).has.length(1);
  });

  it('gives each player entered by hand an own link: before the start it takes the seat, then the player page', async () => {
    const withGuest = config(['human', 'human', 'human']);
    withGuest.players[1].name = 'Klaus';
    withGuest.players[1].color = 'green';
    const room = await lobby.open(HOST, profile('Ann'), '', true, withGuest, starter, [2]);
    const token = (lobby.list(HOST).rooms[0].seats[1] as {inviteToken?: string}).inviteToken;
    expect(token).is.a('string');
    expect((lobby.list(GUEST).rooms[0].seats[1] as {inviteToken?: string}).inviteToken).is.undefined;
    // An unchanged guest keeps the link when the host edits the game
    lobby.edit(HOST, room.id, '', true, withGuest, [2]);
    expect((lobby.list(HOST).rooms[0].seats[1] as {inviteToken?: string}).inviteToken).eq(token);
    const joined = await lobby.join(GUEST, profile('Klaus K', 'red'), room.id, starter, token);
    expect(joined.seats.map((seat) => seat.kind)).deep.eq(['human', 'human', 'free']);
    expect(joined.seats[1]).to.include({name: 'Klaus K', color: 'green', you: true});

    const second = await lobby.open(OTHER, profile('Cid'), '', true, withGuest, starter, [2]);
    await lobby.startNow(OTHER, second.id, starter);
    const guest = lobby.list(OTHER).rooms.find((r) => r.id === second.id)?.seats[1] as {playerId?: string, inviteToken?: string};
    expect(guest.playerId).eq('p1');
    expect(guest.inviteToken).is.undefined;
  });

  it('frees the seat of a participant who stopped polling, and closes the room without host', async () => {
    const room = await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'human']), starter);
    await lobby.join(GUEST, profile('Bob'), room.id, starter);
    now += PARTICIPANT_TIMEOUT_MS / 2;
    lobby.list(HOST);
    now += PARTICIPANT_TIMEOUT_MS / 2 + 1;
    expect(lobby.list(HOST).rooms[0].seats[1].kind).eq('free');
    now += PARTICIPANT_TIMEOUT_MS + 1;
    expect(lobby.list(undefined).rooms).has.length(0);
  });

  it('keeps the room of a host reachable by push and tells the host about a join', async () => {
    const joins: Array<string> = [];
    lobby.setNotifier({canReach: (participant) => participant === HOST, notify: (host, kind, room, name) => joins.push(`${kind} ${host} ${room.path} ${name}`)});
    const room = await lobby.open(HOST, profile('Ann'), 'Evening', true, config(['human', 'human', 'human']), starter);
    now += PARTICIPANT_TIMEOUT_MS * 10;
    expect(lobby.list(undefined).rooms).has.length(1);
    await lobby.join(GUEST, profile('Bob'), room.id, starter);
    expect(joins).deep.eq([`joined ${HOST} ${lobbyRoomPath(room.id, 'Evening')} Bob`]);
    // Joining again (already seated) sends nothing
    await lobby.join(GUEST, profile('Bob'), room.id, starter);
    expect(joins).has.length(1);
    lobby.list(GUEST);
    now += REACHABLE_TIMEOUT_MS;
    expect(lobby.list(undefined).rooms).has.length(0);
  });

  it('tells everybody seated except whoever started it that the game started', async () => {
    const messages: Array<string> = [];
    lobby.setNotifier({canReach: () => true, notify: (participant, kind, _room, name) => messages.push(`${kind} ${participant} ${name}`)});
    const room = await lobby.open(HOST, profile('Ann'), 'Evening', true, config(['human', 'human', 'human']), starter);
    await lobby.join(GUEST, profile('Bob'), room.id, starter);
    // A joiner reachable by push keeps the seat with the lobby closed, to be called back by the start
    now += PARTICIPANT_TIMEOUT_MS * 10;
    lobby.list(HOST);
    expect(lobby.list(HOST).rooms[0].seats[1].kind).eq('human');
    await lobby.startNow(HOST, room.id, starter);
    expect(messages).deep.eq([`joined ${HOST} Bob`, `started ${GUEST} Ann`]);
  });

  it('lists unlisted rooms only for their participants or with their id', async () => {
    const room = await lobby.open(HOST, profile('Ann'), '', false, config(['human', 'human']), starter);
    expect(lobby.list(OTHER).rooms).has.length(0);
    expect(lobby.list(OTHER, room.id).rooms).has.length(1);
    expect(lobby.list(HOST).yourRoomId).eq(room.id);
  });

  it('keeps a participant in one room only', async () => {
    const first = await lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'human']), starter);
    const second = await lobby.open(OTHER, profile('Cid'), '', true, config(['human', 'human', 'human']), starter);
    await lobby.join(GUEST, profile('Bob'), first.id, starter);
    await lobby.join(GUEST, profile('Bob'), second.id, starter);
    const rooms = lobby.list(undefined).rooms;
    expect(rooms.find((r) => r.id === first.id)?.seats[1].kind).eq('free');
    expect(rooms.find((r) => r.id === second.id)?.seats[1].kind).eq('human');
  });

  it('keeps the rooms over a restart, with a fresh heartbeat for everybody', async () => {
    const room = await lobby.open(HOST, profile('Ann'), 'Evening game', true, config(['human', 'human', 'human']), starter);
    await lobby.join(GUEST, profile('Bob'), room.id, starter);
    // The server was down longer than the heartbeat timeout
    now += PARTICIPANT_TIMEOUT_MS * 3;
    const restarted = new Lobby(() => now, () => 'other', memoryStorage(storage.data));
    const rooms = restarted.list(OTHER).rooms;
    expect(rooms).has.length(1);
    expect(rooms[0].title).eq('Evening game');
    expect(rooms[0].seats.map((seat) => seat.kind)).deep.eq(['human', 'human', 'free']);
    const joined = await restarted.join(OTHER, profile('Cid'), room.id, starter);
    expect(joined.state).eq('started');
    expect(restarted.list(HOST).rooms[0].yourPlayerId).eq('p0');
  });

  it('seats guests entered by the host and names the game after the room', async () => {
    const withGuest = config(['human', 'human', 'human']);
    withGuest.players[2] = {...withGuest.players[2], name: 'Dora', color: 'green'};
    const room = await lobby.open(HOST, profile('Ann'), 'Evening game', true, withGuest, starter, [1]);
    expect(room.seats.map((seat) => seat.kind)).deep.eq(['human', 'free', 'guest']);
    const joined = await lobby.join(GUEST, profile('Bob', 'green'), room.id, starter);
    expect(joined.state).eq('started');
    expect(started[0].name).eq('Evening game');
    expect(started[0].players.map((p) => [p.name, p.color])).deep.eq([['Ann', 'red'], ['Bob', 'yellow'], ['Dora', 'green']]);
    // The guest's player link is passed on by the host in the room dialog: only the host gets it
    const guestFor = (me: string) => lobby.list(me).rooms[0].seats[2];
    expect(guestFor(HOST)).deep.include({kind: 'guest', playerId: 'p2'});
    expect(guestFor(GUEST)).deep.include({kind: 'guest', playerId: undefined});
  });

  it('passes a predefined game on to the start', async () => {
    const predefined = {...config(['human', 'ai']), clonedGamedId: 'g99' as const};
    await lobby.open(HOST, profile('Ann'), 'Replay', true, predefined, starter, []);
    expect(started[0].clonedGamedId).eq('g99');
  });

  it('drops invalid profile parts', async () => {
    const room = await lobby.open(HOST, {name: '  Ann  ', color: 'red', emoji: 'nope', image: 'javascript:alert(1)'}, '', true, config(['human', 'human']), starter);
    const host = room.seats[0];
    expect(host.kind === 'human' && [host.name, host.emoji, host.image]).deep.eq(['Ann', '🚀', undefined]);
  });
});

describe('lobbyUrl', () => {
  it('builds readable room paths', () => {
    expect(lobbyRoomPath('x4m9', 'Spiel für Jürgen & Co.')).eq('lobby/room/x4m9-Spiel_fuer_Juergen_Co');
    expect(lobbyRoomPath('x4m9', 'Straße  über Élan')).eq('lobby/room/x4m9-Strasse_ueber_Elan');
    expect(lobbyRoomPath('x4m9', 'Игра Жени')).eq('lobby/room/x4m9-Igra_Zheni');
    expect(lobbyRoomPath('x4m9', '火星ゲーム')).eq('lobby/room/x4m9');
  });

  it('reads the room id from the address', () => {
    expect(lobbyRoomIdFromPath('/lobby/room/x4m9-Spiel_fuer_Juergen')).eq('x4m9');
    expect(lobbyRoomIdFromPath('/tm/lobby/room/x4m9')).eq('x4m9');
    expect(lobbyRoomIdFromPath('/lobby')).is.undefined;
  });

  it('recognizes the address of the create form', () => {
    expect(isLobbyCreatePath('/lobby/create')).is.true;
    expect(isLobbyCreatePath('/tm/lobby/create/')).is.true;
    expect(isLobbyCreatePath('/lobby')).is.false;
    expect(isLobbyCreatePath('/lobby/room/x4m9-create')).is.false;
  });
});
