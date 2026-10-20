import {expect} from 'chai';
import {ApiDevTools} from '../../src/server/routes/ApiDevTools';
import {Game} from '../../src/server/Game';
import {TestPlayer} from '../TestPlayer';
import {MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {statusCode} from '@/common/http/statusCode';
import {IGame} from '../../src/server/IGame';

describe('ApiDevTools', () => {
  let res: MockResponse;
  let scaffolding: RouteTestScaffolding;
  let game: IGame;
  let player: TestPlayer;

  beforeEach(async () => {
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
    player = TestPlayer.BLACK.newPlayer({name: 'Jens'});
    game = Game.newInstance('game-id', [player], player, 'spectatorid');
    await scaffolding.ctx.gameLoader.add(game);
    scaffolding.url = '/api/devtools';
  });

  // The route reads the body via 'data'/'end' events – only send after post() has started
  function post(body: object): Promise<unknown> {
    const response = scaffolding.post(new ApiDevTools(), res);
    const emit = Promise.resolve().then(() => {
      scaffolding.req.emitString(JSON.stringify(body));
      scaffolding.req.emitter.emit('end');
    });
    return Promise.all([emit, response]);
  }

  it('refuses everybody without the admin login', async () => {
    await post({playerId: player.id, action: {type: 'globals', oxygen: 5}});
    expect(res.statusCode).eq(statusCode.forbidden);
    expect(game.getOxygenLevel()).eq(0);
  });

  it('changes the game for the admin and writes it into the log', async () => {
    scaffolding.loginAsAdmin();
    await post({playerId: player.id, action: {type: 'globals', oxygen: 5}});
    expect(res.statusCode).eq(statusCode.ok);
    expect(game.getOxygenLevel()).eq(5);
    expect(game.gameLog[game.gameLog.length - 1].message).eq('🛠 DevTools: oxygen set to ${0}');
  });

  it('refuses unknown actions', async () => {
    scaffolding.loginAsAdmin();
    await post({playerId: player.id, action: {type: 'win the game'}});
    expect(res.statusCode).eq(statusCode.badRequest);
  });
});
