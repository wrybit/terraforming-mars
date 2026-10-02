import {expect} from 'chai';
import * as os from 'os';
import * as path from 'path';
import {mkdtempSync, rmSync, writeFileSync} from 'fs';
import {ImportedScreenshot} from '../../src/server/routes/ImportedScreenshot';
import {ImportedScreenshotsStore} from '../../src/server/admin/ImportedScreenshotsStore';
import {MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {statusCode} from '@/common/http/statusCode';

describe('ImportedScreenshot', () => {
  let folder: string;
  let route: ImportedScreenshot;
  let scaffolding: RouteTestScaffolding;
  let res: MockResponse;

  beforeEach(() => {
    folder = mkdtempSync(path.join(os.tmpdir(), 'screenshots-'));
    writeFileSync(path.join(folder, '1191812877926023229.jpg'), 'jpeg-bytes');
    route = new ImportedScreenshot(new ImportedScreenshotsStore(folder));
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
  });

  afterEach(() => {
    rmSync(folder, {recursive: true, force: true});
  });

  it('serves a saved screenshot as jpeg', async () => {
    scaffolding.url = '/imported-screenshot?id=1191812877926023229';
    await scaffolding.get(route, res);
    expect(res.content).eq('jpeg-bytes');
    expect(res.headers.get('Content-Type')).eq('image/jpeg');
  });

  it('unknown or unsafe ids are not found', async () => {
    for (const id of ['123456789', '../secret', '']) {
      res = new MockResponse();
      scaffolding.url = `/imported-screenshot?id=${encodeURIComponent(id)}`;
      await scaffolding.get(route, res);
      expect(res.statusCode).eq(statusCode.notFound);
    }
  });
});
