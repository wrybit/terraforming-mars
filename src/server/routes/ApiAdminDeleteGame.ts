import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {readBody} from './readBody';
import {isGameId} from '../../common/Types';
import {AdminDeleteGameRequest} from '../../common/admin/AdminGameSummary';
import {ImportedGamesStore} from '../admin/ImportedGamesStore';

/** Löscht ein eigenes Spiel endgültig aus Speicher und Datenbank oder entfernt ein importiertes Ergebnis. */
export class ApiAdminDeleteGame extends Handler {
  public static readonly INSTANCE = new ApiAdminDeleteGame();
  constructor(private readonly importedGames: ImportedGamesStore = ImportedGamesStore.getInstance()) {
    super({validateServerId: true});
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const {id} = JSON.parse(await readBody(req)) as AdminDeleteGameRequest;
    if (this.importedGames.remove(id)) {
      responses.writeJson(res, ctx, {deleted: id});
      return;
    }
    if (!isGameId(id) || await ctx.gameLoader.getGame(id) === undefined) {
      throw RouteError.notFound('game not found');
    }
    await ctx.gameLoader.deleteGame(id);
    responses.writeJson(res, ctx, {deleted: id});
  }
}
