import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdtempSync, rmSync} from 'fs';
import {ApiAdminGames} from '../../src/server/routes/ApiAdminGames';
import {ApiAdminDeleteGame} from '../../src/server/routes/ApiAdminDeleteGame';
import {ApiAdminImportGame} from '../../src/server/routes/ApiAdminImportGame';
import {ImportedGamesStore} from '../../src/server/admin/ImportedGamesStore';
import {ImportedSnapshotsStore} from '../../src/server/admin/ImportedSnapshotsStore';
import {ApiPlayer} from '../../src/server/routes/ApiPlayer';
import {ApiGameLogs} from '../../src/server/routes/ApiGameLogs';
import {Game} from '../../src/server/Game';
import {TestPlayer} from '../TestPlayer';
import {MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {statusCode} from '@/common/http/statusCode';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';
import {Phase} from '@/common/Phase';
import {Handler} from '../../src/server/routes/Handler';

describe('ApiAdmin', () => {
  let res: MockResponse;
  let scaffolding: RouteTestScaffolding;
  let folder: string;
  let store: ImportedGamesStore;
  let snapshots: ImportedSnapshotsStore;

  beforeEach(async () => {
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
    folder = mkdtempSync(path.join(os.tmpdir(), 'api-admin-'));
    store = new ImportedGamesStore(path.join(folder, 'imported-games.json'));
    snapshots = new ImportedSnapshotsStore(path.join(folder, 'imported'));
    ImportedSnapshotsStore.setInstanceForTesting(snapshots);
    const player = TestPlayer.BLACK.newPlayer({name: 'Jens'});
    await scaffolding.ctx.gameLoader.add(Game.newInstance('game-id', [player], player, 'spectatorid'));
  });

  afterEach(() => {
    ImportedSnapshotsStore.setInstanceForTesting(undefined);
    rmSync(folder, {recursive: true, force: true});
  });

  // Fremder Server: Ansicht ohne generation-Parameter, sonst ein Log
  function fakeServer(view: object) {
    return async (url: string) => new URL(url).searchParams.has('generation') ? [{message: 'log'}] : view;
  }

  // Die Routen lesen den Body über 'data'/'end'-Events – erst senden, nachdem post() gestartet ist
  function post(handler: Handler, body: object): Promise<unknown> {
    scaffolding.url = '/api/admin?serverId=1';
    scaffolding.req.headers.host = '192.168.178.77:17745';
    const response = scaffolding.post(handler, res);
    const emit = Promise.resolve().then(() => {
      scaffolding.req.emitString(JSON.stringify(body));
      scaffolding.req.emitter.emit('end');
    });
    return Promise.all([emit, response]);
  }

  it('all admin routes need the server id', async () => {
    for (const handler of [new ApiAdminGames(store), new ApiAdminDeleteGame(store, snapshots), new ApiAdminImportGame(store, snapshots)]) {
      scaffolding.url = '/api/admin';
      res = new MockResponse();
      await handler.processRequest(scaffolding.req, res, scaffolding.ctx);
      expect(res.statusCode).eq(statusCode.forbidden);
    }
  });

  it('lists local games', async () => {
    scaffolding.url = '/api/admin/games?serverId=1';
    await new ApiAdminGames(store).processRequest(scaffolding.req, res, scaffolding.ctx);
    const summaries: Array<AdminGameSummary> = JSON.parse(res.content);
    expect(summaries.map((s) => [s.id, s.source, s.players[0].name])).deep.eq([['game-id', 'local', 'Jens']]);
  });

  it('deletes a local game', async () => {
    await post(new ApiAdminDeleteGame(store, snapshots), {id: 'game-id'});
    expect(await scaffolding.ctx.gameLoader.getGame('game-id')).is.undefined;
  });

  it('deleting via the public address is forbidden', async () => {
    scaffolding.url = '/api/admin?serverId=1';
    scaffolding.req.headers.host = 'gww20.duckdns.org:17745';
    await scaffolding.post(new ApiAdminDeleteGame(store, snapshots), res);
    expect(res.statusCode).eq(statusCode.forbidden);
    expect(await scaffolding.ctx.gameLoader.getGame('game-id')).is.not.undefined;
  });

  it('unknown game cannot be deleted', async () => {
    await post(new ApiAdminDeleteGame(store, snapshots), {id: 'g-unknown'});
    expect(res.statusCode).eq(statusCode.notFound);
  });

  it('an imported game lives on here: result page and log, until it is deleted', async () => {
    const view = {color: 'red', game: {phase: Phase.END, generation: 1}, players: [{name: 'Jens', color: 'red', megacredits: 1, victoryPointsBreakdown: {total: 80}}]};
    await post(new ApiAdminImportGame(store, snapshots, fakeServer(view)), {url: 'https://example.org/the-end?id=p123456789abc'});
    expect(store.list().map((s) => s.id)).deep.eq(['import-example.org-p123456789abc']);

    res = new MockResponse();
    scaffolding.url = '/api/player?id=p123456789abc';
    scaffolding.req.method = 'GET';
    await ApiPlayer.INSTANCE.processRequest(scaffolding.req, res, scaffolding.ctx);
    expect(JSON.parse(res.content).players[0].name).eq('Jens');

    res = new MockResponse();
    scaffolding.url = '/api/game/logs?id=p123456789abc&generation=1';
    await ApiGameLogs.INSTANCE.processRequest(scaffolding.req, res, scaffolding.ctx);
    expect(JSON.parse(res.content)).deep.eq([{message: 'log'}]);

    res = new MockResponse();
    await post(new ApiAdminDeleteGame(store, snapshots), {id: 'import-example.org-p123456789abc'});
    expect(store.list()).deep.eq([]);
    expect(snapshots.get('p123456789abc')).is.undefined;
  });

  it('refuses a second import of the same game', async () => {
    const view = {color: 'red', game: {phase: Phase.END, generation: 9}, players: []};
    const handler = new ApiAdminImportGame(store, snapshots, fakeServer(view));
    await post(handler, {url: 'https://example.org/the-end?id=p123456789abc'});
    res = new MockResponse();
    await post(handler, {url: 'https://example.org/the-end?id=p123456789abc'});
    expect(res.statusCode).eq(statusCode.badRequest);
  });
});
