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

  it('counts game pages, not other pages', async () => {
    await status('/api/status?id=pabc123');
    await status('/api/status?id=sxyz789');
    await status('/api/status?id=pabc123');
    await status('/api/status?id=not-a-participant');
    expect((await status('/api/status')).activeParticipants).eq(2);
  });
});
