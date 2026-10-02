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
import {ImportedSnapshotsStore} from '../admin/ImportedSnapshotsStore';
import {isLocalNetworkHost} from '../../common/admin/isLocalNetworkHost';

/** Local network only: permanently deletes an own game from memory and database, or removes an imported result. */
export class ApiAdminDeleteGame extends Handler {
  public static readonly INSTANCE = new ApiAdminDeleteGame();
  constructor(
    private readonly importedGames: ImportedGamesStore = ImportedGamesStore.getInstance(),
    private readonly snapshots: ImportedSnapshotsStore = ImportedSnapshotsStore.getInstance()) {
    super({validateServerId: true});
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    // Only via the home network address: whoever opens the page via DuckDNS must not be able to delete anything
    if (!isLocalNetworkHost(req.headers.host)) {
      throw RouteError.forbidden();
    }
    const {id} = JSON.parse(await readBody(req)) as AdminDeleteGameRequest;
    const importedSummary = this.importedGames.get(id);
    if (importedSummary !== undefined) {
      if (importedSummary.importedParticipantId !== undefined) {
        this.snapshots.remove(importedSummary.importedParticipantId);
      }
      this.importedGames.remove(id);
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
