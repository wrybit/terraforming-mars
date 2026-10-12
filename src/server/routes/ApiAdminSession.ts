import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {readBody} from './readBody';
import {AdminLoginRequest, AdminSessionStatus} from '../../common/admin/adminLogin';
import {adminCookieLifetimeSeconds, adminCookieName, adminToken, isSecureRequest} from '../server/auth/adminCookie';

// Slows down guessing the passphrase: every wrong attempt costs this long
const FAILED_LOGIN_DELAY_MS = 1000;

/**
 * Admin login. GET: is this browser logged in? Always 200 with {admin}, since the menu of every page
 * asks (an error status would show up in every visitor's console).
 * POST: checks the passphrase from the body and sets the login cookie.
 */
export class ApiAdminSession extends Handler {
  public static readonly INSTANCE = new ApiAdminSession();
  constructor(private readonly failedLoginDelayMs: number = FAILED_LOGIN_DELAY_MS) {
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
    if (request.serverId !== ctx.ids.serverId) {
      await new Promise((resolve) => setTimeout(resolve, this.failedLoginDelayMs));
      throw RouteError.forbidden();
    }
    responses.setCookie(res, adminCookieName, adminToken(ctx.ids.serverId), adminCookieLifetimeSeconds, isSecureRequest(req));
    responses.writeJson(res, ctx, {admin: true});
  }
}
