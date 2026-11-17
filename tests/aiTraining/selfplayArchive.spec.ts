import {expect} from 'chai';
import {SelfplayArchive, ImportedSelfplayGame, SelfplayArchiveStorage} from '../../src/server/aiTraining/selfplayArchive';
import {GameKeeper} from '../../src/server/aiTraining/AiTrainingGames';
import {IGame} from '../../src/server/IGame';
import {testGame} from '../TestGame';
import {selfplayArchivePath} from '../../src/common/aiTraining/selfplayArchive';
import {GameId} from '../../src/common/Types';

const [archivedGame] = testGame(2);
const SERIALIZED = JSON.stringify(archivedGame.serialize());
const REF = {machine: 'oracle', gameId: 'game-1'};

function setup() {
  let stored: Array<ImportedSelfplayGame> = [];
  const storage: SelfplayArchiveStorage = {load: () => stored.map((game) => ({...game})), save: (games) => stored = games.map((game) => ({...game}))};
  const fetched: Array<string> = [];
  const kept = new Map<string, IGame>();
  const keeper: GameKeeper = {
    keep: async (game) => {
      kept.set(game.id, game);
    },
    remove: async (gameId) => {
      kept.delete(gameId);
    },
    load: async (gameId) => kept.get(gameId),
  };
  const archive = new SelfplayArchive(async (kind, ref) => {
    fetched.push(selfplayArchivePath(kind, ref));
    return kind === 'game' ? SERIALIZED : '{"decisions": []}';
  }, storage);
  return {archive, keeper, kept, fetched, stored: () => stored};
}

describe('SelfplayArchive', () => {
  it('imports an archived game once and opens it again afterwards', async () => {
    const {archive, keeper, kept, fetched} = setup();
    const first = await archive.open(REF, keeper);
    const again = await archive.open(REF, keeper);
    expect(again).eq(first);
    expect(fetched).deep.eq(['/api/selfplay/game/oracle/game-1']);
    expect(kept.size).eq(1);
  });

  it('imports a game only once when it is opened twice at the same time', async () => {
    const {archive, keeper, kept} = setup();
    const [a, b] = await Promise.all([archive.open(REF, keeper), archive.open(REF, keeper)]);
    expect(a).eq(b);
    expect(kept.size).eq(1);
  });

  it('imports the game again when it was removed meanwhile', async () => {
    const {archive, keeper, kept, fetched} = setup();
    await archive.open(REF, keeper);
    kept.clear();
    await archive.open(REF, keeper);
    expect(fetched.length).eq(2);
  });

  it('knows the origin of an imported game for its decision log', async () => {
    const {archive, keeper, kept} = setup();
    await archive.open(REF, keeper);
    const [localId] = kept.keys();
    expect(archive.refOf(localId as GameId)).deep.eq(REF);
    expect(archive.refOf('g-other' as GameId)).undefined;
    expect(JSON.parse(await archive.record(REF))).deep.eq({decisions: []});
  });

  it('has nothing to show without a training hub', async () => {
    const archive = new SelfplayArchive(undefined, {load: () => [], save: () => {}});
    expect(archive.available).false;
  });
});
