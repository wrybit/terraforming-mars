import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {collectStatsGames} from '../stats/collectStatsGames';

/** Beendete Partien für die öffentliche Statistikseite (/stats); ausgewertet wird im Browser. */
export class ApiStatsGames extends Handler {
  public static readonly INSTANCE = new ApiStatsGames();
  private constructor() {
    super();
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    responses.writeJson(res, ctx, await collectStatsGames(ctx.gameLoader));
  }
}
