import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {SelfplayArchive} from '../aiTraining/selfplayArchive';

/**
 * Decision log of a self-play game of the new AI, admins only.
 * GET ?id=<participant>: the log as JSON; with &check: only whether the game has one ({available}).
 */
export class ApiDecisionLog extends Handler {
  public static readonly INSTANCE = new ApiDecisionLog();
  private constructor(private readonly archive: () => SelfplayArchive = () => SelfplayArchive.getInstance()) {
    super({validateServerId: true});
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const game = await ctx.gameLoader.getGame(ctx.urlParams.participantId('id'));
    const ref = game === undefined ? undefined : this.archive().refOf(game.id);
    if (ctx.url.searchParams.has('check')) {
      responses.writeJson(res, ctx, {available: ref !== undefined});
      return;
    }
    if (ref === undefined) {
      throw RouteError.notFound('This game has no decision log');
    }
    let record: string;
    try {
      record = await this.archive().record(ref);
    } catch (error) {
      console.error(`Could not fetch the decision log of ${ref.machine}/${ref.gameId}`, error);
      throw RouteError.notFound('The training hub does not answer');
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(record);
  }
}
