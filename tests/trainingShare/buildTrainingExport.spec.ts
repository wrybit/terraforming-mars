import {expect} from 'chai';
import * as zlib from 'zlib';
import {Phase} from '../../src/common/Phase';
import {GameId} from '../../src/common/Types';
import {SerializedGame} from '../../src/server/SerializedGame';
import {buildTrainingExport, TrainingExportError} from '../../src/server/trainingShare/buildTrainingExport';
import {TRAINING_EXPORT_CONTRACT, TrainingExport} from '../../src/common/trainingShare/TrainingShareModel';
import {testGame} from '../TestGame';
import {InMemoryDatabase} from '../testing/InMemoryDatabase';
import {restoreTestDatabase, setTestDatabase} from '../testing/setup';

const OPTIONS = {secret: 'a'.repeat(64), decisionDirectory: undefined, serverVersion: 'abc1234'};

function unpack(compressed: Buffer): {text: string, data: TrainingExport} {
  const text = zlib.gunzipSync(compressed).toString('utf8');
  return {text, data: JSON.parse(text)};
}

describe('buildTrainingExport', () => {
  let db: InMemoryDatabase;
  let saves: Array<SerializedGame>;
  let gameId: GameId;
  let playerIds: Array<string>;

  beforeEach(() => {
    db = new InMemoryDatabase();
    setTestDatabase(db);
    const [game, ...players] = testGame(2);
    players[0].name = 'Ada Lovelace';
    players[1].name = 'Kenji';
    const first = game.serialize();
    game.phase = Phase.END;
    const last = game.serialize();
    last.players[0].user = 'discord-123' as SerializedGame['players'][0]['user'];
    saves = [first, last];
    gameId = game.id;
    playerIds = players.map((player) => player.id);
    db.games.set(gameId, saves);
  });

  afterEach(() => restoreTestDatabase());

  it('anonymous: no real id, name or Discord id leaves the server', async () => {
    const built = await buildTrainingExport(gameId, {...OPTIONS, anonymous: true});
    const {text, data} = unpack(built.compressed);
    for (const secret of [gameId, ...playerIds, saves[1].spectatorId, 'Ada Lovelace', 'Kenji', 'discord-123']) {
      expect(text, secret).not.to.include(secret);
    }
    expect(data.gameId).to.eq(built.exportedGameId);
    expect(data.gameId).to.match(new RegExp(TRAINING_EXPORT_CONTRACT.idPattern));
    expect(data.anonymous).is.true;
    expect(data.meta.players.map((player) => player.name)).deep.eq(['Player 1', 'Player 2']);
    expect(data.saves.map((save) => save.saveId)).deep.eq([0, 1]);
    expect((data.saves[1].game as SerializedGame).name).to.eq('Game');
  });

  it('not anonymous: names stay, ids are still replaced', async () => {
    const {text, data} = unpack((await buildTrainingExport(gameId, {...OPTIONS, anonymous: false})).compressed);
    expect(text).to.include('Ada Lovelace');
    for (const id of [gameId, ...playerIds]) {
      expect(text).not.to.include(id);
    }
    expect(data.meta.serverVersion).to.eq('abc1234');
  });

  it('keeps the format of the contract the receiver checks', async () => {
    const {data} = unpack((await buildTrainingExport(gameId, {...OPTIONS, anonymous: true})).compressed);
    for (const [field, type] of Object.entries(TRAINING_EXPORT_CONTRACT.fields)) {
      const value = (data as unknown as Record<string, unknown>)[field];
      expect(Array.isArray(value) ? 'array' : typeof value, field).to.eq(type);
    }
    expect(data.format).to.eq(TRAINING_EXPORT_CONTRACT.format);
    for (const save of data.saves) {
      for (const [field, type] of Object.entries(TRAINING_EXPORT_CONTRACT.saveFields)) {
        expect(typeof (save as unknown as Record<string, unknown>)[field]).to.eq(type);
      }
    }
  });

  it('the same id gets the same pseudonym, another server key another one', async () => {
    const first = await buildTrainingExport(gameId, {...OPTIONS, anonymous: true});
    const again = await buildTrainingExport(gameId, {...OPTIONS, anonymous: true});
    const other = await buildTrainingExport(gameId, {...OPTIONS, secret: 'b'.repeat(64), anonymous: true});
    expect(again.exportedGameId).to.eq(first.exportedGameId);
    expect(other.exportedGameId).not.to.eq(first.exportedGameId);
  });

  it('refuses unfinished games and games without a human', async () => {
    db.games.set(gameId, [saves[0]]);
    await expectRefusal(gameId, 'not finished');
    const aiOnly = {...saves[1], players: saves[1].players.map((player) => ({...player, aiLevel: 'hard' as const}))};
    db.games.set(gameId, [aiOnly as SerializedGame]);
    await expectRefusal(gameId, 'no human player');
  });

  async function expectRefusal(id: GameId, reason: string) {
    try {
      await buildTrainingExport(id, {...OPTIONS, anonymous: true});
      expect.fail('expected a refusal');
    } catch (error) {
      expect(error).to.be.instanceOf(TrainingExportError);
      expect((error as Error).message).to.include(reason);
    }
  }
});
