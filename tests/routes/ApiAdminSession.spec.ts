import {expect} from 'chai';
import {ApiAdminSession} from '../../src/server/routes/ApiAdminSession';
import {ApiAdminLogout} from '../../src/server/routes/ApiAdminLogout';
import {ApiGames} from '../../src/server/routes/ApiGames';
import {adminToken, isAdminToken, isSecureRequest} from '../../src/server/server/auth/adminCookie';
import {MockRequest, MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {statusCode} from '@/common/http/statusCode';

describe('ApiAdminSession', () => {
  let scaffolding: RouteTestScaffolding;
  let res: MockResponse;

  beforeEach(() => {
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
  });

  // The route reads the body via 'data'/'end' events – only send after post() has started
  function login(serverId: string): Promise<unknown> {
    scaffolding.url = '/api/admin/session';
    const response = new ApiAdminSession(0).processRequest(Object.assign(scaffolding.req, {method: 'POST'}), res, scaffolding.ctx);
    const emit = Promise.resolve().then(() => {
      scaffolding.req.emitString(JSON.stringify({serverId}));
      scaffolding.req.emitter.emit('end');
    });
    return Promise.all([emit, response]);
  }

  it('sets the login cookie for the right passphrase, never the passphrase itself', async () => {
    await login('1');
    expect(res.statusCode).eq(statusCode.ok);
    const cookie = String(res.getHeader('Set-Cookie'));
    expect(cookie).contains(`tmAdmin=${adminToken('1')};`);
    expect(cookie).contains('HttpOnly');
    expect(cookie).contains('SameSite=Strict');
    expect(cookie).not.contains('tmAdmin=1;');
  });

  it('refuses a wrong passphrase', async () => {
    await login('2');
    expect(res.statusCode).eq(statusCode.forbidden);
    expect(res.getHeader('Set-Cookie')).is.undefined;
  });

  it('reports whether the browser is logged in', async () => {
    await scaffolding.get(new ApiAdminSession(0), res);
    expect(res.statusCode).eq(statusCode.forbidden);

    res = new MockResponse();
    scaffolding.loginAsAdmin();
    await scaffolding.get(new ApiAdminSession(0), res);
    expect(res.statusCode).eq(statusCode.ok);
  });

  it('admin routes accept the cookie but no passphrase in the address', async () => {
    scaffolding.url = '/api/games?serverId=1';
    await scaffolding.get(ApiGames.INSTANCE, res);
    expect(res.statusCode).eq(statusCode.forbidden);
  });

  it('logout clears the cookie', async () => {
    await scaffolding.post(ApiAdminLogout.INSTANCE, res);
    expect(String(res.getHeader('Set-Cookie'))).contains('tmAdmin=deleted;');
  });

  it('a changed passphrase ends the login', () => {
    expect(isAdminToken(adminToken('old'), 'old')).is.true;
    expect(isAdminToken(adminToken('old'), 'new')).is.false;
    expect(isAdminToken(undefined, 'old')).is.false;
  });

  it('marks the cookie Secure only behind https', () => {
    const req = new MockRequest();
    expect(isSecureRequest(req)).is.false;
    req.headers['x-forwarded-proto'] = 'https';
    expect(isSecureRequest(req)).is.true;
    req.headers['x-forwarded-proto'] = 'http';
    expect(isSecureRequest(req)).is.false;
  });
});
