import {expect} from 'chai';
import {Handler} from '../../src/server/routes/Handler';
import {Context} from '../../src/server/routes/IHandler';
import {Request} from '../../src/server/Request';
import {Response} from '../../src/server/Response';
import {MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {statusCode} from '@/common/http/statusCode';

class StatsHandler extends Handler {
  constructor() {
    super({validateStatsId: true});
  }
  public override get(_req: Request, res: Response, _ctx: Context): Promise<void> {
    res.end('ok');
    return Promise.resolve();
  }
}

describe('Handler validateStatsId', () => {
  let scaffolding: RouteTestScaffolding;
  let res: MockResponse;

  beforeEach(() => {
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
  });

  it('redirects the server id to the stats id', async () => {
    scaffolding.url = '/api/stats?serverId=1';
    await scaffolding.get(new StatsHandler(), res);
    expect(res.statusCode).eq(statusCode.movedPermanently);
  });

  it('answers the stats id', async () => {
    scaffolding.url = '/api/stats?serverId=2';
    await scaffolding.get(new StatsHandler(), res);
    expect(res.content).eq('ok');
  });

  it('answers when server id and stats id are the same instead of redirecting forever', async () => {
    scaffolding.ctx.ids.statsId = '1';
    scaffolding.url = '/api/stats?serverId=1';
    await scaffolding.get(new StatsHandler(), res);
    expect(res.content).eq('ok');
  });
});
