import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {markServerUpdating} from '../server/serverUpdate';

// Open pages poll every 5 s: after this long all of them show the update notice and refuse inputs
const ANNOUNCE_MILLISECONDS = 8000;

/**
 * Restarts the server so saved settings take effect (admin page). Announced like an update; the process then
 * ends and Docker starts it again (restart policy), which reads the settings anew.
 */
export class ApiAdminRestart extends Handler {
  public static readonly INSTANCE = new ApiAdminRestart();
  private constructor() {
    super({validateServerId: true});
  }

  public override post(_req: Request, res: Response, ctx: Context): Promise<void> {
    markServerUpdating();
    responses.writeJson(res, ctx, {restartInMilliseconds: ANNOUNCE_MILLISECONDS});
    setTimeout(() => process.exit(0), ANNOUNCE_MILLISECONDS);
    return Promise.resolve();
  }
}
