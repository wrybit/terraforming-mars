import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {AiSupportModel} from '../../common/models/AiSupportModel';
import {aiAdminSettings, rustAiSupport} from '../ai/aiEngineChoice';

/** Which AI plays new games and what the Rust AI can play (aiCompatibility.ts); public, read by the create form. */
export class ApiAiSupport extends Handler {
  public static readonly INSTANCE = new ApiAiSupport();
  private constructor() {
    super();
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    // Short cache: an admin switch or a bot deploy shows up within a minute
    res.setHeader('Cache-Control', 'public, max-age=60');
    const model: AiSupportModel = {...aiAdminSettings(), rust: rustAiSupport()};
    responses.writeJson(res, ctx, model);
    return Promise.resolve();
  }
}
