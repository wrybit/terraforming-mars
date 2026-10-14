import {expect} from 'chai';
import {processRequest} from '../../src/server/server/requestProcessor';
import {MockRequest, MockResponse} from '../routes/HttpMocks';

describe('requestProcessor', () => {
  it('routes a request from an allowed IP to a handler', async () => {
    // The default MockRequest socket address (127.0.0.1) is not on the blocklist.
    const req = new MockRequest();
    const res = new MockResponse();
    req.url = '/';
    await processRequest(req, res);

    expect(req.url).eq('/assets/index.html');
  });

  it('waits for the routed handler to finish writing the response before returning', async () => {
    // ServeAsset reads the file asynchronously, so this exercises a handler
    // that suspends on a real await before writing headers/body.
    const req = new MockRequest();
    const res = new MockResponse();
    req.url = '/';

    await processRequest(req, res);

    expect(res.content.length).greaterThan(0);
    expect(res.getHeader('Content-Length')).eq(res.content.length);
  });

  it('sends the security headers with every response', async () => {
    const req = new MockRequest();
    const res = new MockResponse();
    req.url = '/';
    await processRequest(req, res);

    expect(res.getHeader('X-Content-Type-Options')).eq('nosniff');
    expect(res.getHeader('X-Frame-Options')).eq('SAMEORIGIN');
    expect(res.getHeader('Referrer-Policy')).eq('same-origin');
  });

  it('forwards an address with a trailing slash to the one without', async () => {
    const req = new MockRequest();
    const res = new MockResponse();
    req.url = '/admin/?tab=games';
    await processRequest(req, res);

    expect(res.statusCode).eq(302);
    expect(res.getHeader('Location')).eq('/admin?tab=games');
  });
});
