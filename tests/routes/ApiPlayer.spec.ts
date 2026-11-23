import {expect} from 'chai';
import {ApiPlayer} from '../../src/server/routes/ApiPlayer';
import {Game} from '../../src/server/Game';
import {TestPlayer} from '../TestPlayer';
import {MockResponse} from './HttpMocks';
import {PlayerViewModel} from '../../src/common/models/PlayerModel';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {statusCode} from '@/common/http/statusCode';
import {startThinking, stopThinking} from '../../src/server/ai/aiThinking';
import {SelectOption} from '../../src/server/inputs/SelectOption';

describe('ApiPlayer', () => {
  let scaffolding: RouteTestScaffolding;
  let res: MockResponse;

  beforeEach(() => {
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
  });

  it('no parameter', async () => {
    scaffolding.url = '/api/player';
    await scaffolding.get(ApiPlayer.INSTANCE, res);
    expect(res.statusCode).eq(statusCode.badRequest);
    expect(res.content).eq('Bad request: missing id parameter');
  });

  it('fails invalid player id', async () => {
    scaffolding.url = '/api/player?id=googoo';
    await scaffolding.get(ApiPlayer.INSTANCE, res);
    expect(res.statusCode).eq(statusCode.badRequest);
    expect(res.content).eq('Bad request: invalid player id');
  });

  it('fails game not found', async () => {
    scaffolding.url = '/api/player?id=p123';
    await scaffolding.get(ApiPlayer.INSTANCE, res);
    expect(res.statusCode).eq(statusCode.notFound);
    expect(res.content).eq('Not found');
  });

  it('pulls player', async () => {
    const player = TestPlayer.BLACK.newPlayer();
    scaffolding.url = '/api/player?id=' + player.id;
    const game = Game.newInstance('game-id', [player], player, 'spectatorid');
    await scaffolding.ctx.gameLoader.add(game);
    await scaffolding.get(ApiPlayer.INSTANCE, res);
    const response: PlayerViewModel = JSON.parse(res.content);
    expect(response.id).eq(player.id);
    expect(response.aiThinking).is.undefined;
  });

  it('sends the AI players deciding right now with the view', async () => {
    // The log shows the thinking line with the view itself, not only after the next poll of /api/waitingfor
    const player = TestPlayer.BLACK.newPlayer();
    const ai = TestPlayer.RED.newPlayer();
    scaffolding.url = '/api/player?id=' + player.id;
    const game = Game.newInstance('game-id-thinking', [player, ai], player, 'spectatorid');
    await scaffolding.ctx.gameLoader.add(game);
    const decision = new SelectOption('move');
    startThinking(ai, decision, 2000);
    try {
      await scaffolding.get(ApiPlayer.INSTANCE, res);
      const response: PlayerViewModel = JSON.parse(res.content);
      expect(response.aiThinking?.map((entry) => entry.color)).deep.eq([ai.color]);
    } finally {
      stopThinking(ai, decision);
    }
  });
});
