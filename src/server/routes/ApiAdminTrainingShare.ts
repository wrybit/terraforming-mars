import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {readBody} from './readBody';
import {TrainingShare} from '../trainingShare/TrainingShare';
import {isGameId} from '../../common/Types';

/**
 * Sharing finished games for the AI training (admins only): GET the state for the Export tab and the games list,
 * POST {"gameId": "g…"} shares one finished game now.
 */
export class ApiAdminTrainingShare extends Handler {
  public static readonly INSTANCE = new ApiAdminTrainingShare();
  private constructor() {
    super({validateServerId: true});
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    responses.writeJson(res, ctx, TrainingShare.getInstance().status());
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let gameId: unknown;
    try {
      gameId = JSON.parse(await readBody(req) || '{}').gameId;
    } catch {
      gameId = undefined;
    }
    if (!isGameId(gameId)) {
      responses.badRequest(req, res, 'Send {"gameId": "g…"} with the id of a finished game.');
      return;
    }
    responses.writeJson(res, ctx, await TrainingShare.getInstance().share(gameId));
  }
}
