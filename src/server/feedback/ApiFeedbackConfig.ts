import * as responses from '../server/responses';
import {Handler} from '../routes/Handler';
import {Context} from '../routes/IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {feedbackConfig} from './feedbackSettings';

/** Tells the client whether the feedback is on and whether the server delivers it (otherwise: GitHub issue). */
export class ApiFeedbackConfig extends Handler {
  public static readonly INSTANCE = new ApiFeedbackConfig();
  private constructor() {
    super();
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    responses.writeJson(res, ctx, feedbackConfig());
    return Promise.resolve();
  }
}
