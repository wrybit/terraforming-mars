import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {withoutAiTrainingGames} from '../aiTraining/aiTrainingGameIds';

export class ApiGames extends Handler {
  public static readonly INSTANCE = new ApiGames();
  private constructor() {
    super({validateServerId: true});
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const list = await ctx.gameLoader.getIds();
    if (list === undefined) {
      throw RouteError.notFound('could not load game list');
    }
    // AI training games are only for watching from the lobby (aiTrainingGameIds.ts)
    responses.writeJson(res, ctx, withoutAiTrainingGames(list));
  }
}
