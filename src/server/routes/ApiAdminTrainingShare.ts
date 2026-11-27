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
 * POST {"gameId": "g…"} shares one finished game now, POST {"test": true} only tests the connection to the receiver.
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
    let body: {gameId?: unknown, test?: unknown} = {};
    try {
      body = JSON.parse(await readBody(req) || '{}') ?? {};
    } catch {
      body = {};
    }
    if (body.test === true) {
      responses.writeJson(res, ctx, await TrainingShare.getInstance().testReceiver());
      return;
    }
    const gameId = body.gameId;
    if (!isGameId(gameId)) {
      responses.badRequest(req, res, 'Send {"gameId": "g…"} with the id of a finished game, or {"test": true}.');
      return;
    }
    responses.writeJson(res, ctx, await TrainingShare.getInstance().share(gameId));
  }
}
