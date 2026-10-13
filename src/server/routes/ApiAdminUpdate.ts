import * as path from 'path';
import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {requestUpdate} from '../admin/dashboard/updateRequest';

/**
 * Update to the newest commit (admin dashboard). Only leaves a request in the data folder: the update script of the
 * server operator builds the new version and swaps the container, announced to open pages like every update.
 */
export class ApiAdminUpdate extends Handler {
  public static readonly INSTANCE = new ApiAdminUpdate();
  private constructor() {
    super({validateServerId: true});
  }

  public override post(_req: Request, res: Response, ctx: Context): Promise<void> {
    responses.writeJson(res, ctx, requestUpdate(path.resolve('db')));
    return Promise.resolve();
  }
}
