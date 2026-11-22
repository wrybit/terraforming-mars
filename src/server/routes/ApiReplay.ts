import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {Database} from '../database/Database';
import {Phase} from '../../common/Phase';
import {replaySource} from '../replay/replaySource';
import {SerializedGame} from '../SerializedGame';

// Raw material of a replay for the results page: start and end of a finished game. Nothing extra is stored,
// the client reconstructs every step from the log (replay/reconstructReplay.ts).
export class ApiReplay extends Handler {
  public static readonly INSTANCE = new ApiReplay();
  private constructor() {
    super();
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const id = ctx.urlParams.participantId('id');
    const game = await ctx.gameLoader.getGame(id);
    if (game === undefined) {
      throw RouteError.notFound(`game ${id} not found on this server (deleted or imported from another server)`);
    }
    if (game.phase !== Phase.END) {
      throw RouteError.badRequest(`game ${game.id} is not finished yet`);
    }
    let start: SerializedGame;
    try {
      start = await Database.getInstance().getGameVersion(game.id, 0);
    } catch {
      throw RouteError.notFound(`start of game ${game.id} is not saved on this server`);
    }
    responses.writeJson(res, ctx, replaySource(start, game.serialize(), game.standardProjects.map((card) => card.name)));
  }
}
