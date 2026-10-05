import * as responses from '../server/responses';
import {Server} from '../models/ServerModel';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {Game} from '../Game';
import {cancellableActionStart} from '../actionStart';

/**
 * Cancels the active player's current action and returns to its start (actionStart.ts) –
 * only while the action revealed nothing hidden and did not affect other players.
 */
export class CancelAction extends Handler {
  public static readonly INSTANCE = new CancelAction();
  private constructor() {
    super();
  }

  public override async post(_req: Request, res: Response, ctx: Context): Promise<void> {
    const playerId = ctx.urlParams.playerId('id');
    const game = await ctx.gameLoader.getGame(playerId);
    if (game === undefined) {
      throw RouteError.notFound();
    }
    const player = game.players.find((p) => p.id === playerId);
    if (player === undefined) {
      throw RouteError.notFound();
    }
    const start = cancellableActionStart(player);
    if (start === undefined) {
      throw RouteError.badRequest('This action can no longer be cancelled');
    }
    // Restoring brings the player back to the action menu (deserialize → takeAction)
    const restored = Game.deserialize(start);
    restored.undoCount = game.undoCount + 1;
    const restoredPlayer = restored.getPlayerById(player.id);
    restored.log('${0} cancelled the action', (b) => b.player(restoredPlayer));
    await ctx.gameLoader.add(restored);
    responses.writeJson(res, ctx, Server.getPlayerModel(restoredPlayer));
  }
}
