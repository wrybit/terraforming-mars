import {expect} from 'chai';
import {AI_ONLY_GAME_KEEP_MS, isAiOnlyGame, removeAiOnlyGames, resetAiOnlyGameChecks} from '../../src/server/aiTraining/aiOnlyGames';
import {memoryTrainingStorage, StoredAiTrainingGame} from '../../src/server/aiTraining/aiTrainingStore';
import {IGameLoader} from '../../src/server/database/IGameLoader';
import {IGame} from '../../src/server/IGame';
import {GameId} from '../../src/common/Types';
import {Phase} from '../../src/common/Phase';

const NOW = 1_000_000_000;

function fakeGame(id: string, aiLevels: ReadonlyArray<string | undefined>, phase: Phase, lastActivityMs: number): IGame {
  return {id, phase, lastActivityTime: new Date(lastActivityMs), players: aiLevels.map((aiLevel) => ({aiLevel}))} as unknown as IGame;
}

function fakeLoader(games: ReadonlyArray<IGame>) {
  const deleted: Array<string> = [];
  const loaded: Array<string> = [];
  const loader = {
    getIds: async () => games.map((game) => ({gameId: game.id, participantIds: []})),
    getGame: async (gameId: GameId) => {
      loaded.push(gameId);
      return games.find((game) => game.id === gameId);
    },
    deleteGame: async (gameId: GameId) => {
      deleted.push(gameId);
    },
  } as unknown as IGameLoader;
  return {loader, deleted, loaded};
}

describe('aiOnlyGames', () => {
  beforeEach(() => resetAiOnlyGameChecks());

  it('knows games without a human', () => {
    expect(isAiOnlyGame({players: [{aiLevel: 'hard'}, {aiLevel: 'easy'}]})).is.true;
    expect(isAiOnlyGame({players: [{aiLevel: 'hard'}, {aiLevel: undefined}]})).is.false;
    expect(isAiOnlyGame({players: []})).is.false;
  });

  it('removes finished AI-only games, keeps humans, running games, fresh ones and the lobby games', async () => {
    const old = NOW - AI_ONLY_GAME_KEEP_MS - 1;
    const {loader, deleted} = fakeLoader([
      fakeGame('gaionly', ['hard', 'hard'], Phase.END, old),
      fakeGame('ghuman', [undefined, 'hard'], Phase.END, old),
      fakeGame('grunning', ['hard', 'hard'], Phase.ACTION, old),
      fakeGame('gfresh', ['hard', 'hard'], Phase.END, NOW - 1000),
      fakeGame('globby', ['hard', 'hard'], Phase.END, old),
    ]);
    const storage = memoryTrainingStorage([{gameId: 'globby' as GameId} as StoredAiTrainingGame]);
    expect(await removeAiOnlyGames(loader, storage, NOW)).deep.eq(['gaionly']);
    expect(deleted).deep.eq(['gaionly']);
  });

  it('loads a game with a human only once', async () => {
    const {loader, loaded} = fakeLoader([fakeGame('ghuman', [undefined], Phase.END, 0)]);
    await removeAiOnlyGames(loader, memoryTrainingStorage(), NOW);
    await removeAiOnlyGames(loader, memoryTrainingStorage(), NOW);
    expect(loaded).deep.eq(['ghuman']);
  });
});
