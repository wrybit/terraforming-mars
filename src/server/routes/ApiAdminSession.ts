import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {readBody} from './readBody';
import {AdminLoginRequest, AdminSessionStatus} from '../../common/admin/adminLogin';
import {adminCookieLifetimeSeconds, adminCookieName, adminToken, isSecureRequest, isServerIdGuess} from '../server/auth/adminCookie';
import {LoginThrottle} from '../server/auth/LoginThrottle';

const SECOND = 1000;
const DAY = 24 * 60 * 60 * SECOND;

/** The two counters of failed logins: per client address, and a safety net across all addresses. */
export type AdminLoginThrottles = {
  perAddress: LoginThrottle,
  everyone: LoginThrottle,
};

// Every wrong passphrase doubles the wait of that address: 1 s, 2 s, 4 s … up to 15 minutes
function defaultThrottles(): AdminLoginThrottles {
  return {
    perAddress: new LoginThrottle({freeFailures: 0, baseDelayMs: SECOND, maxDelayMs: 15 * 60 * SECOND, forgetAfterMs: DAY}),
    // Catches guessing from many addresses at once; a normal admin never gets near it
    everyone: new LoginThrottle({freeFailures: 50, baseDelayMs: SECOND, maxDelayMs: 15 * 60 * SECOND, forgetAfterMs: DAY}),
  };
}

const EVERYONE = '*';

/**
 * Admin login. GET: is this browser logged in? Always 200 with {admin}, since the menu of every page
 * asks (an error status would show up in every visitor's console).
 * POST: checks the passphrase from the body and sets the login cookie. After a wrong passphrase the
 * address is locked for a growing time (429 until then); both answers carry Retry-After in seconds.
 */
export class ApiAdminSession extends Handler {
  public static readonly INSTANCE = new ApiAdminSession();
  constructor(private readonly throttles: AdminLoginThrottles = defaultThrottles()) {
    super();
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const status: AdminSessionStatus = {admin: this.isServerIdValid(ctx)};
    responses.writeJson(res, ctx, status);
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let request: AdminLoginRequest;
    try {
      request = JSON.parse(await readBody(req));
    } catch {
      throw RouteError.badRequest('Invalid request');
    }
    // Checked only after the body arrived: from here on everything runs without a pause, so parallel
    // requests always see the failures recorded before them
    const now = ctx.clock.now();
    const lockMs = Math.max(
      this.throttles.perAddress.remainingLockMs(ctx.ip, now),
      this.throttles.everyone.remainingLockMs(EVERYONE, now));
    if (lockMs > 0) {
      setRetryAfter(res, lockMs);
      throw RouteError.tooManyRequests();
    }
    if (!isServerIdGuess(request.serverId, ctx.ids.serverId)) {
      setRetryAfter(res, Math.max(
        this.throttles.perAddress.recordFailure(ctx.ip, now),
        this.throttles.everyone.recordFailure(EVERYONE, now)));
      throw RouteError.forbidden();
    }
    this.throttles.perAddress.recordSuccess(ctx.ip);
    this.throttles.everyone.recordSuccess(EVERYONE);
    responses.setCookie(res, adminCookieName, adminToken(ctx.ids.serverId, now), adminCookieLifetimeSeconds, isSecureRequest(req));
    responses.writeJson(res, ctx, {admin: true});
  }
}

function setRetryAfter(res: Response, lockMs: number): void {
  res.setHeader('Retry-After', String(Math.ceil(lockMs / SECOND)));
}
