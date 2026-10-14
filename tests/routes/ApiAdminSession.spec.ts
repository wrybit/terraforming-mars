import {expect} from 'chai';
import {ApiAdminSession} from '../../src/server/routes/ApiAdminSession';
import {ApiAdminLogout} from '../../src/server/routes/ApiAdminLogout';
import {ApiGames} from '../../src/server/routes/ApiGames';
import {adminCookieLifetimeSeconds, adminToken, isAdminToken, isSecureRequest} from '../../src/server/server/auth/adminCookie';
import {MockRequest, MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {statusCode} from '@/common/http/statusCode';
import {FakeClock} from '../common/FakeClock';

describe('ApiAdminSession', () => {
  let scaffolding: RouteTestScaffolding;
  let res: MockResponse;

  beforeEach(() => {
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
  });

  // The route reads the body via 'data'/'end' events – only send after post() has started
  function login(serverId: string, route: ApiAdminSession = new ApiAdminSession()): Promise<unknown> {
    scaffolding.url = '/api/admin/session';
    const response = route.processRequest(Object.assign(scaffolding.req, {method: 'POST'}), res, scaffolding.ctx);
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
    expect(cookie).contains(`tmAdmin=${adminToken('1', scaffolding.ctx.clock.now())};`);
    expect(cookie).contains('HttpOnly');
    expect(cookie).contains('SameSite=Strict');
    expect(cookie).not.contains('tmAdmin=1;');
  });

  it('refuses a wrong passphrase', async () => {
    await login('2');
    expect(res.statusCode).eq(statusCode.forbidden);
    expect(res.getHeader('Set-Cookie')).is.undefined;
  });

  describe('failed logins', () => {
    let route: ApiAdminSession;
    let clock: FakeClock;

    beforeEach(() => {
      route = new ApiAdminSession();
      clock = new FakeClock();
    });

    // Each attempt is a fresh request from the same address, sharing the route's counters and the clock
    async function attempt(serverId: string, ip: string = '1.2.3.4'): Promise<MockResponse> {
      scaffolding = new RouteTestScaffolding();
      scaffolding.ctx.clock = clock;
      scaffolding.ctx.ip = ip;
      res = new MockResponse();
      await login(serverId, route);
      return res;
    }

    it('lock doubles with every wrong passphrase', async () => {
      const waits: Array<string | undefined> = [];
      for (let i = 0; i < 4; i++) {
        const response = await attempt('wrong');
        expect(response.statusCode).eq(statusCode.forbidden);
        waits.push(String(response.getHeader('Retry-After')));
        clock.millis += 60 * 60 * 1000;
      }
      expect(waits).deep.eq(['1', '2', '4', '8']);
    });

    it('refuses even the right passphrase while locked, without extending the lock', async () => {
      await attempt('wrong');
      clock.millis += 1000;
      await attempt('wrong');
      clock.millis += 500;
      const locked = await attempt('1');
      expect(locked.statusCode).eq(statusCode.tooManyRequests);
      expect(locked.getHeader('Retry-After')).eq('2');
      expect(locked.getHeader('Set-Cookie')).is.undefined;

      clock.millis += 1500;
      const open = await attempt('1');
      expect(open.statusCode).eq(statusCode.ok);
    });

    it('a successful login starts from zero', async () => {
      await attempt('wrong');
      clock.millis += 1000;
      await attempt('1');
      const response = await attempt('wrong');
      expect(response.getHeader('Retry-After')).eq('1');
    });

    it('locks each address on its own', async () => {
      await attempt('wrong', '1.1.1.1');
      const other = await attempt('1', '2.2.2.2');
      expect(other.statusCode).eq(statusCode.ok);
    });

    it('locks everyone after many failures from many addresses', async () => {
      for (let i = 0; i < 51; i++) {
        await attempt('wrong', `10.0.0.${i}`);
      }
      const fresh = await attempt('1', '9.9.9.9');
      expect(fresh.statusCode).eq(statusCode.tooManyRequests);
    });

    it('caps the lock at 15 minutes', async () => {
      let response = res;
      for (let i = 0; i < 20; i++) {
        response = await attempt('wrong');
        clock.millis += 60 * 60 * 1000;
      }
      expect(response.getHeader('Retry-After')).eq(String(15 * 60));
    });
  });

  it('reports whether the browser is logged in', async () => {
    await scaffolding.get(new ApiAdminSession(), res);
    expect(res.statusCode).eq(statusCode.ok);
    expect(JSON.parse(res.content)).deep.eq({admin: false});

    res = new MockResponse();
    scaffolding.loginAsAdmin();
    await scaffolding.get(new ApiAdminSession(), res);
    expect(JSON.parse(res.content)).deep.eq({admin: true});
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
    expect(isAdminToken(adminToken('old', 1000), 'old', 1000)).is.true;
    expect(isAdminToken(adminToken('old', 1000), 'new', 1000)).is.false;
    expect(isAdminToken(undefined, 'old', 1000)).is.false;
  });

  it('a login ends after the login duration', () => {
    const issued = 1_000_000;
    const lifetimeMs = adminCookieLifetimeSeconds * 1000;
    expect(isAdminToken(adminToken('id', issued), 'id', issued + lifetimeMs)).is.true;
    expect(isAdminToken(adminToken('id', issued), 'id', issued + lifetimeMs + 1)).is.false;
    // A forged time with the old hash does not pass either
    const forged = String(issued + lifetimeMs) + adminToken('id', issued).slice(String(issued).length);
    expect(isAdminToken(forged, 'id', issued + lifetimeMs)).is.false;
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
