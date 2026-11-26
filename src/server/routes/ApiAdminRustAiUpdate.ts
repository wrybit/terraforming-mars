import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {readBody} from './readBody';
import {rustAiUpdater} from '../ai/rust/RustAiUpdater';

/**
 * Self-update of the Rust AI (admin settings, AI tab): GET the state of the last check, POST checks now;
 * {"install": true} also installs a newer release when automatic updates are off.
 */
export class ApiAdminRustAiUpdate extends Handler {
  public static readonly INSTANCE = new ApiAdminRustAiUpdate();
  private constructor() {
    super({validateServerId: true});
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    responses.writeJson(res, ctx, rustAiUpdater.getStatus());
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let install = false;
    try {
      install = JSON.parse(await readBody(req) || '{}').install === true;
    } catch {
      // No or broken body: only check
    }
    responses.writeJson(res, ctx, await rustAiUpdater.check(install));
  }
}
