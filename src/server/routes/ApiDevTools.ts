import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {readBody} from './readBody';
import {isPlayerId} from '../../common/Types';
import {DevToolsRequest, isDevToolsAction} from '../../common/devtools/devToolsAction';
import {applyDevToolsAction} from '../devtools/applyDevToolsAction';

/**
 * DevTools (Jens, 20 Oct 2026): changes a running game for testing. Only with the admin login (validateServerId), and
 * every change goes into the game log, visible to all players – so nobody can use it against others unseen.
 */
export class ApiDevTools extends Handler {
  public static readonly INSTANCE = new ApiDevTools();
  constructor() {
    super({validateServerId: true});
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let request: DevToolsRequest;
    try {
      request = JSON.parse(await readBody(req));
    } catch {
      throw RouteError.badRequest('Invalid request');
    }
    if (!isPlayerId(request.playerId) || !isDevToolsAction(request.action)) {
      throw RouteError.badRequest('Invalid request');
    }
    const game = await ctx.gameLoader.getGame(request.playerId);
    if (game === undefined) {
      throw RouteError.notFound('game not found');
    }
    applyDevToolsAction(game, request.action);
    // The log line raised the game age: every open page reloads the game
    game.save();
    responses.writeJson(res, ctx, {ok: true});
  }
}
