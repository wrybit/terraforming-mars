import {expect} from 'chai';
import {ApiReplay} from '../../src/server/routes/ApiReplay';
import {MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {testGame} from '../TestGame';
import {statusCode} from '../../src/common/http/statusCode';
import {Phase} from '../../src/common/Phase';

describe('ApiReplay', () => {
  let scaffolding: RouteTestScaffolding;
  let res: MockResponse;

  beforeEach(() => {
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
  });

  it('fails when id not provided', async () => {
    scaffolding.url = '/api/replay';
    await scaffolding.get(ApiReplay.INSTANCE, res);
    expect(res.statusCode).eq(statusCode.badRequest);
  });

  it('names the game when it is not found', async () => {
    scaffolding.url = '/api/replay?id=player-invalid-id';
    await scaffolding.get(ApiReplay.INSTANCE, res);
    expect(res.statusCode).eq(statusCode.notFound);
    expect(res.content).contains('player-invalid-id');
  });

  it('refuses a game that is still running', async () => {
    const [game, player] = testGame(2);
    await scaffolding.ctx.gameLoader.add(game);
    scaffolding.url = '/api/replay?id=' + player.id;
    await scaffolding.get(ApiReplay.INSTANCE, res);
    expect(res.statusCode).eq(statusCode.badRequest);
    expect(res.content).contains('not finished');
  });

  // Imported or copied games have no save 0 – the replay then starts from the end instead of failing
  it('replays a finished game without saved start', async () => {
    const [game, player] = testGame(2);
    game.phase = Phase.END;
    await scaffolding.ctx.gameLoader.add(game);
    scaffolding.url = '/api/replay?id=' + player.id;
    await scaffolding.get(ApiReplay.INSTANCE, res);
    expect(res.statusCode).eq(statusCode.ok);
    expect(JSON.parse(res.content).players).has.length(2);
  });
});
