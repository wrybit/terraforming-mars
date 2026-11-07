import {expect} from 'chai';
import {AiTrainingGames, GameKeeper, databaseKeeper} from '../../src/server/aiTraining/AiTrainingGames';
import {GameLoader} from '../../src/server/database/GameLoader';
import {importAiTrainingGame} from '../../src/server/aiTraining/importAiTrainingGame';
import {AiTrainingFeedSource} from '../../src/server/aiTraining/aiTrainingFeedSource';
import {memoryTrainingStorage} from '../../src/server/aiTraining/aiTrainingStore';
import {AiTrainingFeed, AiTrainingFinishedGame, aiTrainingTitle} from '../../src/common/lobby/AiTrainingFeed';
import {IGame} from '../../src/server/IGame';
import {testGame} from '../TestGame';
import {SpectatorId} from '../../src/common/Types';

// Final state as an AI test batch sends it: every batch game has the ids "game-id", "spectator-id", "p-…-id"
const [batchGame] = testGame(2);
const SERIALIZED = JSON.stringify(batchGame.serialize());

function finished(index: number, number: number, finishedAt: number): AiTrainingFinishedGame {
  return {index, number, finishedAt, playerCount: 2, level: 'normal', variants: ['baseline', 'noCheapFirst'],
    generation: 12, elapsedMs: 61_000, gamePath: `/games/game-${index}.json`};
}

function feedWith(finishedGames: Array<AiTrainingFinishedGame>): AiTrainingFeed {
  return {
    batch: {id: 'b1', commit: 'b689b74bac3fc4d9'},
    live: [{index: 7, playerCount: 2, level: 'normal', variants: ['baseline', 'baseline'], gameOptions: {preludeExtension: true},
      generation: 4, terraforming: 0.3, elapsedMs: 20_000}],
    finished: finishedGames,
  };
}

function setup(feed: () => AiTrainingFeed) {
  let now = 1_000_000;
  const kept: Array<IGame> = [];
  const removed: Array<string> = [];
  const keeper: GameKeeper = {keep: async (game) => {
    kept.push(game);
  }, remove: async (gameId) => {
    removed.push(gameId);
  }};
  const source: AiTrainingFeedSource = {feed: async () => feed(), game: async () => SERIALIZED};
  const storage = memoryTrainingStorage();
  const games = new AiTrainingGames(source, storage, () => now);
  return {games, keeper, kept, removed, storage, later: () => now += 10_000};
}

describe('AiTrainingGames', () => {
  it('names a game after AI version, tested variant and running number', () => {
    expect(aiTrainingTitle('b689b74bac', ['baseline', 'noCheapFirst'], 221516)).eq('AI-Training b689b74 noCheapFirst #221.516');
    expect(aiTrainingTitle('b689b74bac', ['baseline', 'baseline'])).eq('AI-Training b689b74 baseline');
    expect(aiTrainingTitle('b689b74bac', undefined, 12)).eq('AI-Training b689b74 #12');
  });

  it('shows nothing without a configured feed', async () => {
    expect(await new AiTrainingGames(undefined, memoryTrainingStorage()).rooms({keep: async () => {}, remove: async () => {}})).deep.eq([]);
  });

  it('lists running games as information and imports finished ones to watch', async () => {
    const {games, keeper, kept} = setup(() => feedWith([finished(1, 100, 500)]));
    const rooms = await games.rooms(keeper);
    expect(rooms.map((room) => room.title)).deep.eq(['AI-Training b689b74 baseline', 'AI-Training b689b74 noCheapFirst #100']);
    const [live, done] = rooms;
    expect(live.aiTraining).deep.eq({finished: false});
    expect(live.spectatorId).is.undefined;
    expect(live.progress).deep.eq({generation: 4, terraforming: 0.3, playedMs: 20_000});
    expect(live.setup.expansions.prelude).is.true;
    expect(done.aiTraining).deep.eq({finished: true});
    expect(done.spectatorId).eq(kept[0].spectatorId);
    // Fresh ids, AI players (out of the statistics), names after the variants
    expect(kept[0].id).not.eq(batchGame.id);
    expect(kept[0].players.map((player) => player.id)).not.deep.eq(batchGame.players.map((player) => player.id));
    expect(kept[0].players.map((player) => player.aiLevel)).deep.eq(['normal', 'normal']);
    expect(kept[0].players.map((player) => player.name)).deep.eq(['baseline', 'noCheapFirst']);
    expect(kept[0].name).eq('AI-Training b689b74 noCheapFirst #100');
  });

  it('keeps the last three finished games and removes older ones', async () => {
    let finishedGames = [finished(1, 100, 500), finished(2, 101, 600), finished(3, 102, 700)];
    const {games, keeper, kept, removed, storage, later} = setup(() => feedWith(finishedGames));
    await games.rooms(keeper);
    expect(kept).has.length(3);
    // Asked again before the feed is stale: nothing new is imported
    await games.rooms(keeper);
    expect(kept).has.length(3);
    finishedGames = [finished(2, 101, 600), finished(3, 102, 700), finished(4, 103, 800)];
    later();
    const rooms = await games.rooms(keeper);
    expect(kept).has.length(4);
    expect(removed).deep.eq([kept[0].id]);
    expect(storage.games.map((game) => game.number)).deep.eq([101, 102, 103]);
    expect(rooms.filter((room) => room.aiTraining?.finished).map((room) => room.id)).deep.eq(['ai-training-103', 'ai-training-102', 'ai-training-101']);
  });

  it('keeps the finished games when the coordinator is off', async () => {
    let online = true;
    const {games, keeper, later} = setup(() => {
      if (!online) {
        throw new Error('offline');
      }
      return feedWith([finished(1, 100, 500)]);
    });
    await games.rooms(keeper);
    online = false;
    later();
    const rooms = await games.rooms(keeper);
    expect(rooms.map((room) => room.id)).deep.eq(['ai-training-100']);
  });

  it('an imported game can be opened with its spectator link', async () => {
    const game = importAiTrainingGame(SERIALIZED, 'AI-Training b689b74 #1', 'hard', undefined);
    await databaseKeeper(GameLoader.getInstance()).keep(game);
    expect(game.spectatorId).is.not.undefined;
    const loaded = await GameLoader.getInstance().getGame(game.spectatorId as SpectatorId);
    expect(loaded?.id).eq(game.id);
    expect(loaded?.players.map((player) => player.name)).deep.eq(['AI 1', 'AI 2']);
  });
});
