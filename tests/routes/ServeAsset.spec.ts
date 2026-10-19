import {expect} from 'chai';
import fs from 'fs';
import {FileAPI, ServeAsset} from '../../src/server/routes/ServeAsset';
import {MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {statusCode} from '../../src/common/http/statusCode';
class FileApiMock extends FileAPI {
  public counts = {
    readFile: 0,
    readFileSync: 0,
    existsSync: 0,
  };
  public constructor() {
    super();
  }
  public override readFileSync(path: string): Buffer {
    this.counts.readFileSync++;
    return Buffer.from('data: ' + path);
  }
  public override readFile(path: string): Promise<Buffer> {
    this.counts.readFile++;
    return Promise.resolve(Buffer.from('data: ' + path));
  }
  public override existsSync(_path: string): boolean {
    this.counts.existsSync++;
    return true;
  }
}

describe('ServeAsset', () => {
  let instance: ServeAsset;
  let scaffolding: RouteTestScaffolding;
  let res: MockResponse;
  let fileApi: FileApiMock;
  // The expected state of call counts in most simple cases in this test. This is a template
  // used and overridden below. That makes how individual condition changes these calls.
  const primedCache = {
    readFile: 0,
    readFileSync: 3,
    existsSync: 0,
  };

  const storedNodeEnv = process.env.NODE_ENV;
  beforeEach(() => {
    instance = new ServeAsset(undefined, false);
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
    fileApi = new FileApiMock();
  });
  afterEach(() => {
    process.env.NODE_ENV = storedNodeEnv;
  });
  it('bad filename', async () => {
    scaffolding.url = 'goo.goo.gaa.gaa';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);
    expect(res.statusCode).eq(statusCode.notFound);
    expect(res.content).eq('Not found');
  });

  it('index.html', async () => {
    scaffolding.url = '/assets/index.html';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);
    expect(res.content.startsWith('<!DOCTYPE html>'));
  });

  it('styles.css', async () => {
    instance = new ServeAsset(undefined, false, fileApi);
    scaffolding.url = '/styles.css';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);
    expect(res.content).eq('data: build/styles.css');
  });

  it('styles.css.gz', async () => {
    instance = new ServeAsset(undefined, false, fileApi);
    scaffolding.url = '/styles.css';
    scaffolding.req.headers['accept-encoding'] = 'gzip';
    await scaffolding.get(instance, res);
    expect(res.content).eq('data: build/styles.css.gz');
  });

  it('theme stylesheet in the theme colours, compressed like styles.css', async () => {
    instance = new ServeAsset(undefined, false, fileApi);
    scaffolding.url = '/assets/themes/dune/styles.css';
    scaffolding.req.headers['accept-encoding'] = 'br, gzip';
    await scaffolding.get(instance, res);
    expect(res.content).eq('data: assets/themes/dune/styles.css.br');
    expect(res.headers.get('Content-Type')).eq('text/css');
  });

  it('styles.css: uncached', async () => {
    instance = new ServeAsset(undefined, false, fileApi);
    // Primes the cache.
    expect(fileApi.counts).deep.eq(primedCache);

    scaffolding.url = '/styles.css';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);

    expect(res.content).eq('data: build/styles.css');
    expect(fileApi.counts).deep.eq({
      ...primedCache,
      readFile: 1, // Still read.
    });
  });

  it('styles.css.gz: cached', async () => {
    instance = new ServeAsset(undefined, true, fileApi);
    // Primes the cache.
    expect(fileApi.counts).deep.eq(primedCache);

    scaffolding.url = '/styles.css';
    scaffolding.req.headers['accept-encoding'] = 'gzip';
    await scaffolding.get(instance, res);

    expect(res.content).eq('data: build/styles.css.gz');
    expect(fileApi.counts).deep.eq({
      ...primedCache,
      readFile: 0, // Does not change
    });
  });

  it('development main.js', async () => {
    instance = new ServeAsset(undefined, false, fileApi);
    scaffolding.url = '/main.js';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);
    expect(res.content).eq('data: build/main.js');
    expect(fileApi.counts).deep.eq({
      ...primedCache,
      readFile: 1,
      existsSync: 0,
    });
  });

  it('production main.js', async () => {
    process.env.NODE_ENV = 'production';
    instance = new ServeAsset(undefined, false, fileApi);
    scaffolding.url = '/main.js';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);
    expect(res.content).eq('data: build/main.js');
    expect(fileApi.counts).deep.eq({
      ...primedCache,
      readFile: 1,
      existsSync: 0,
    });
  });

  it('sw.js', async () => {
    instance = new ServeAsset(undefined, false, fileApi);
    scaffolding.url = '/sw.js';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);
    expect(res.content).eq('data: build/sw.js');
    expect(fileApi.counts).deep.eq({
      ...primedCache,
      readFile: 1,
      existsSync: 0,
    });
  });

  it('vendors.js', async () => {
    instance = new ServeAsset(undefined, false, fileApi);
    scaffolding.url = '/vendors.js';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);
    expect(res.content).eq('data: build/vendors.js');
  });

  it('chunk js file', async () => {
    instance = new ServeAsset(undefined, false, fileApi);
    scaffolding.url = '/chunks/player-home.js';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);
    expect(res.content).eq('data: build/chunks/player-home.js');
  });

  it('does not serve source maps', async () => {
    // They would publish the full source with comments, including private extensions
    instance = new ServeAsset(undefined, false, fileApi);
    scaffolding.url = '/chunks/player-home.js.map';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);
    expect(res.statusCode).eq(statusCode.notFound);
  });

  it('serves the self-hosted fonts', async () => {
    instance = new ServeAsset(undefined, false, fileApi);
    scaffolding.url = '/assets/fonts/ubuntu/ubuntu-latin-400-normal.woff2';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);
    expect(res.statusCode).eq(statusCode.ok);
    expect(res.getHeader('Content-Type')).eq('font/woff2');
  });

  it('serves the favicon chosen in FAVICON_ICON and FAVICON_COLOR', async () => {
    const stored = {icon: process.env.FAVICON_ICON, color: process.env.FAVICON_COLOR};
    const restore = (key: string, value: string | undefined) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    };
    try {
      instance = new ServeAsset(undefined, false, fileApi);
      scaffolding.url = '/favicon.ico';
      scaffolding.req.headers['accept-encoding'] = '';
      process.env.FAVICON_ICON = 'city';
      process.env.FAVICON_COLOR = 'blue';
      await scaffolding.get(instance, res);
      expect(res.content).eq('data: assets/favicon/city-blue.png');
      expect(res.getHeader('Content-Type')).eq('image/png');

      res = new MockResponse();
      delete process.env.FAVICON_ICON;
      delete process.env.FAVICON_COLOR;
      await scaffolding.get(instance, res);
      expect(res.content).eq('data: assets/favicon.ico');
    } finally {
      restore('FAVICON_ICON', stored.icon);
      restore('FAVICON_COLOR', stored.color);
    }
  });

  it('rejects path traversal in chunks', async () => {
    instance = new ServeAsset(undefined, false, fileApi);
    scaffolding.url = '/chunks/../main.js';
    scaffolding.req.headers['accept-encoding'] = '';
    await scaffolding.get(instance, res);
    expect(res.statusCode).eq(statusCode.notFound);
  });

  it('serves all script sources referenced in index.html', async () => {
    const html = fs.readFileSync('assets/index.html', 'utf8');
    const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
    expect(srcs).to.not.be.empty;
    for (const src of srcs) {
      const perRes = new MockResponse();
      const perScaffolding = new RouteTestScaffolding();
      instance = new ServeAsset(undefined, false, fileApi);
      perScaffolding.url = '/' + src;
      perScaffolding.req.headers['accept-encoding'] = '';
      await perScaffolding.get(instance, perRes);
      expect(perRes.statusCode, `${src} should return 200`).eq(statusCode.ok);
    }
  });
});
