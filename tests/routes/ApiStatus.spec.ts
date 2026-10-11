import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {ApiStatus} from '../../src/server/routes/ApiStatus';
import {MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {clearActiveParticipants} from '../../src/server/server/activeParticipants';
import {clearServerUpdateFlag, serverStartedAt} from '../../src/server/server/serverUpdate';
import {ServerStatusModel} from '../../src/common/models/ServerStatusModel';
import {Game} from '../../src/server/Game';
import {TestPlayer} from '../TestPlayer';
import {Phase} from '../../src/common/Phase';

describe('ApiStatus', () => {
  let scaffolding: RouteTestScaffolding;
  let res: MockResponse;
  let flagFile: string;

  before(() => {
    flagFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'server-update-')), 'flag');
    process.env.SERVER_UPDATE_FLAG_FILE = flagFile;
  });

  after(() => {
    delete process.env.SERVER_UPDATE_FLAG_FILE;
  });

  beforeEach(() => {
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
    clearActiveParticipants();
    clearServerUpdateFlag();
  });

  async function status(url: string): Promise<ServerStatusModel> {
    scaffolding.url = url;
    res = new MockResponse();
    await ApiStatus.INSTANCE.get(scaffolding.req, res, scaffolding.ctx);
    return JSON.parse(res.content);
  }

  it('reports a running server', async () => {
    expect(await status('/api/status')).deep.eq({updating: false, startedAt: serverStartedAt, activeParticipants: 0});
  });

  it('reports an announced update until the flag is removed', async () => {
    fs.writeFileSync(flagFile, '');
    expect((await status('/api/status')).updating).is.true;
    clearServerUpdateFlag();
    expect((await status('/api/status')).updating).is.false;
  });

  it('counts players of running games, not spectators or other pages', async () => {
    const player = TestPlayer.BLUE.newPlayer();
    const other = TestPlayer.RED.newPlayer();
    await scaffolding.ctx.gameLoader.add(Game.newInstance('game-id', [player, other], player, 'spectatorid'));
    await status('/api/status?id=' + player.id);
    await status('/api/status?id=' + player.id);
    await status('/api/status?id=' + other.id);
    await status('/api/status?id=sxyz789');
    await status('/api/status?id=pnot-in-a-game');
    await status('/api/status?id=not-a-participant');
    expect((await status('/api/status')).activeParticipants).eq(2);
  });

  it('does not count players of a finished game', async () => {
    const player = TestPlayer.BLUE.newPlayer();
    const game = Game.newInstance('game-id', [player], player, 'spectatorid');
    game.phase = Phase.END;
    await scaffolding.ctx.gameLoader.add(game);
    await status('/api/status?id=' + player.id);
    expect((await status('/api/status')).activeParticipants).eq(0);
  });
});
