import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {rustAiSupportFile} from '../ai/rust/rustAiSupportFile';

/** What the new AI can play (common/ai/RustAiSupport.ts); public, read by the create-game form. */
export class ApiRustAiSupport extends Handler {
  public static readonly INSTANCE = new ApiRustAiSupport();
  private constructor() {
    super();
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    // Short cache: a bot deploy shows up within a minute without a reload storm
    res.setHeader('Cache-Control', 'public, max-age=60');
    responses.writeJson(res, ctx, rustAiSupportFile.get());
    return Promise.resolve();
  }
}
