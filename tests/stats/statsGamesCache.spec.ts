import {expect} from 'chai';
import {cachedStatsGames, forgetCachedStatsGames} from '../../src/server/stats/statsGamesCache';
import {IGameLoader} from '../../src/server/database/IGameLoader';

describe('statsGamesCache', () => {
  let calls: number;
  const gameLoader = {
    getIds: () => {
      calls++;
      return Promise.resolve([]);
    },
  } as unknown as IGameLoader;

  beforeEach(() => {
    calls = 0;
    forgetCachedStatsGames();
  });

  it('collects at most once per minute', async () => {
    await cachedStatsGames(gameLoader, 0);
    await cachedStatsGames(gameLoader, 59_000);
    expect(calls).eq(1);
    await cachedStatsGames(gameLoader, 60_000);
    expect(calls).eq(2);
  });

  it('parallel calls share one run', async () => {
    await Promise.all([cachedStatsGames(gameLoader, 0), cachedStatsGames(gameLoader, 1)]);
    expect(calls).eq(1);
  });

  it('collects anew after forgetting', async () => {
    await cachedStatsGames(gameLoader, 0);
    forgetCachedStatsGames();
    await cachedStatsGames(gameLoader, 1);
    expect(calls).eq(2);
  });
});
