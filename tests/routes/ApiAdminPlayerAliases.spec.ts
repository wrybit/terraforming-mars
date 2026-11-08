import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdtempSync, rmSync} from 'fs';
import {ApiAdminPlayerAliases} from '../../src/server/routes/ApiAdminPlayerAliases';
import {PlayerAliasesStore} from '../../src/server/stats/PlayerAliasesStore';
import {MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {statusCode} from '@/common/http/statusCode';

describe('ApiAdminPlayerAliases', () => {
  let res: MockResponse;
  let scaffolding: RouteTestScaffolding;
  let folder: string;
  let store: PlayerAliasesStore;
  let handler: ApiAdminPlayerAliases;

  beforeEach(() => {
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
    folder = mkdtempSync(path.join(os.tmpdir(), 'api-player-aliases-'));
    store = new PlayerAliasesStore(path.join(folder, 'player-aliases.json'));
    handler = new ApiAdminPlayerAliases(store);
    scaffolding.url = '/api/admin/player-aliases';
  });

  afterEach(() => {
    rmSync(folder, {recursive: true, force: true});
  });

  // The route reads the body via 'data'/'end' events – only send after post() has started
  function post(body: object): Promise<unknown> {
    scaffolding.loginAsAdmin();
    const response = scaffolding.post(handler, res);
    const emit = Promise.resolve().then(() => {
      scaffolding.req.emitString(JSON.stringify(body));
      scaffolding.req.emitter.emit('end');
    });
    return Promise.all([emit, response]);
  }

  it('needs the admin login', async () => {
    await handler.processRequest(scaffolding.req, res, scaffolding.ctx);
    expect(res.statusCode).eq(statusCode.forbidden);
  });

  it('merges and unmerges', async () => {
    await post({action: 'merge', from: 'jens', to: 'Jens'});
    expect(JSON.parse(res.content).aliases).to.have.length(1);
    expect(store.targets().get('jens')).eq('Jens');
    res = new MockResponse();
    await post({action: 'unmerge', from: 'jens'});
    expect(JSON.parse(res.content).aliases).deep.eq([]);
  });

  it('refuses invalid requests', async () => {
    await post({action: 'merge', from: 'Jens', to: 'Jens'});
    expect(res.statusCode).eq(statusCode.badRequest);
  });
});
