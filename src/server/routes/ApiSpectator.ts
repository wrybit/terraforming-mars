import * as responses from '../server/responses';
import {Server} from '../models/ServerModel';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {ImportedSnapshotsStore} from '../admin/ImportedSnapshotsStore';

export class ApiSpectator extends Handler {
  public static readonly INSTANCE = new ApiSpectator();

  private constructor() {
    super();
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const id = ctx.urlParams.spectatorId('id');
    const game = await ctx.gameLoader.getGame(id);
    if (game === undefined) {
      // Von anderen Servern importierte Spiele gibt es hier nur als gespeicherten Endstand
      const imported = ImportedSnapshotsStore.getInstance().get(id);
      if (imported !== undefined) {
        responses.writeJson(res, ctx, imported.view);
        return;
      }
      throw RouteError.notFound();
    }
    responses.writeJson(res, ctx, Server.getSpectatorModel(game));
  }
}
