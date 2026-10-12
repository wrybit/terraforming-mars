import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {adminCookieName} from '../server/auth/adminCookie';

/** Ends the admin login of this browser. POST only, so no link or prefetch logs out by accident. */
export class ApiAdminLogout extends Handler {
  public static readonly INSTANCE = new ApiAdminLogout();
  private constructor() {
    super();
  }

  public override post(_req: Request, res: Response, ctx: Context): Promise<void> {
    responses.clearCookie(res, adminCookieName);
    responses.writeJson(res, ctx, {admin: false});
    return Promise.resolve();
  }
}
