import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {readBody} from './readBody';
import {ServerSettingsUpdate} from '../../common/admin/serverSettings';
import {readServerSettings, writeServerSettings} from '../admin/serverSettingsFile';

/** Server settings of the admin page: read them, save changes (take effect after a restart, ApiAdminRestart). */
export class ApiAdminSettings extends Handler {
  public static readonly INSTANCE = new ApiAdminSettings();
  private constructor() {
    super({validateServerId: true});
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    responses.writeJson(res, ctx, readServerSettings());
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let update: ServerSettingsUpdate;
    try {
      update = JSON.parse(await readBody(req));
    } catch {
      throw RouteError.badRequest('invalid settings');
    }
    const valid = typeof update === 'object' && update !== null &&
      Object.values(update).every((value) => value === null || typeof value === 'string');
    if (!valid) {
      throw RouteError.badRequest('invalid settings');
    }
    try {
      responses.writeJson(res, ctx, writeServerSettings(update));
    } catch (error) {
      throw RouteError.badRequest(error instanceof Error ? error.message : 'invalid settings');
    }
  }
}
