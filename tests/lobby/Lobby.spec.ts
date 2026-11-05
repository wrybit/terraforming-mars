import {expect} from 'chai';
import {GameStarter, Lobby, PARTICIPANT_TIMEOUT_MS, StartedGame} from '../../src/server/lobby/Lobby';
import {LobbyError} from '../../src/server/lobby/lobbyValidation';
import {NewGameConfig} from '../../src/common/game/NewGameConfig';
import {LobbyProfile} from '../../src/common/lobby/LobbyModel';

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
  const starter: GameStarter = async (gameConfig) => {
    started.push(gameConfig);
    const game: StartedGame = {id: 'g1', spectatorId: 's1', players: gameConfig.players.map((_, index) => ({id: `p${index}` as const}))};
    return game;
  };

  beforeEach(() => {
    now = 1_000_000;
    started = [];
    let next = 0;
    lobby = new Lobby(() => now, () => 'room' + (next++));
  });

  it('opens a room with the host, free seats and AI seats', () => {
    const room = lobby.open(HOST, profile('Ann'), 'Evening game', true, config(['human', 'human', 'ai']));
    expect(room.title).eq('Evening game');
    expect(room.seats.map((seat) => seat.kind)).deep.eq(['human', 'free', 'ai']);
    expect(room.seats[0]).to.include({host: true, you: true, name: 'Ann'});
  });

  it('refuses a room without free seats', () => {
    expect(() => lobby.open(HOST, profile('Ann'), '', true, config(['human', 'ai']))).to.throw(LobbyError);
  });

  it('starts the game once the last seat is taken, in seat order', async () => {
    const room = lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'ai']));
    const joined = await lobby.join(GUEST, profile('Bob'), room.id, starter);
    expect(joined.state).eq('started');
    expect(joined.yourPlayerId).eq('p1');
    expect(started[0].players.map((p) => p.name)).deep.eq(['Ann', 'Bob', 'Yellow']); // Bob also wanted red: green; the AI takes the next free color
    expect(started[0].players.map((p) => p.first)).deep.eq([true, false, false]);
    expect(started[0].players[2].aiLevel).eq('hard');
    expect(lobby.list(HOST).rooms[0].yourPlayerId).eq('p0');
  });

  it('gives a joining player a free color when the preferred one is taken', async () => {
    const room = lobby.open(HOST, profile('Ann', 'red'), '', true, config(['human', 'human', 'human']));
    const joined = await lobby.join(GUEST, profile('Bob', 'red'), room.id, starter);
    const bob = joined.seats[1];
    expect(bob.kind === 'human' && bob.color).not.eq('red');
  });

  it('waits for everybody to be ready', async () => {
    const room = lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'human']));
    await lobby.join(GUEST, profile('Bob'), room.id, starter);
    await lobby.setReady(GUEST, room.id, false, starter);
    await lobby.join(OTHER, profile('Cid'), room.id, starter);
    expect(started).has.length(0);
    const ready = await lobby.setReady(GUEST, room.id, true, starter);
    expect(ready.state).eq('started');
  });

  it('lets only the host fill the free seats with AI players and start', async () => {
    const room = lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'human']));
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

  it('frees the seat of a participant who stopped polling, and closes the room without host', async () => {
    const room = lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'human']));
    await lobby.join(GUEST, profile('Bob'), room.id, starter);
    now += PARTICIPANT_TIMEOUT_MS / 2;
    lobby.list(HOST);
    now += PARTICIPANT_TIMEOUT_MS / 2 + 1;
    expect(lobby.list(HOST).rooms[0].seats[1].kind).eq('free');
    now += PARTICIPANT_TIMEOUT_MS + 1;
    expect(lobby.list(undefined).rooms).has.length(0);
  });

  it('lists unlisted rooms only for their participants or with their id', () => {
    const room = lobby.open(HOST, profile('Ann'), '', false, config(['human', 'human']));
    expect(lobby.list(OTHER).rooms).has.length(0);
    expect(lobby.list(OTHER, room.id).rooms).has.length(1);
    expect(lobby.list(HOST).yourRoomId).eq(room.id);
  });

  it('keeps a participant in one room only', async () => {
    const first = lobby.open(HOST, profile('Ann'), '', true, config(['human', 'human', 'human']));
    const second = lobby.open(OTHER, profile('Cid'), '', true, config(['human', 'human', 'human']));
    await lobby.join(GUEST, profile('Bob'), first.id, starter);
    await lobby.join(GUEST, profile('Bob'), second.id, starter);
    const rooms = lobby.list(undefined).rooms;
    expect(rooms.find((r) => r.id === first.id)?.seats[1].kind).eq('free');
    expect(rooms.find((r) => r.id === second.id)?.seats[1].kind).eq('human');
  });

  it('drops invalid profile parts', () => {
    const room = lobby.open(HOST, {name: '  Ann  ', color: 'red', emoji: 'nope', image: 'javascript:alert(1)'}, '', true, config(['human', 'human']));
    const host = room.seats[0];
    expect(host.kind === 'human' && [host.name, host.emoji, host.image]).deep.eq(['Ann', '🚀', undefined]);
  });
});
