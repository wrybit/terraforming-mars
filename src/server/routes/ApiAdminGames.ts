import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {AdminGameSummary} from '../../common/admin/AdminGameSummary';
import {localGameSummary} from '../admin/localGameSummary';
import {ImportedGamesStore} from '../admin/ImportedGamesStore';

/** All games for the admin overview: own games and imported results, newest first. */
export class ApiAdminGames extends Handler {
  public static readonly INSTANCE = new ApiAdminGames();
  constructor(private readonly importedGames: ImportedGamesStore = ImportedGamesStore.getInstance()) {
    super({validateServerId: true});
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const ledger = await ctx.gameLoader.getIds();
    const localSummaries: Array<AdminGameSummary> = [];
    for (const {gameId} of ledger) {
      const game = await ctx.gameLoader.getGame(gameId);
      // A broken game state must not break the whole overview
      if (game !== undefined) {
        localSummaries.push(localGameSummary(game));
      }
    }
    const summaries = [...localSummaries, ...this.importedGames.list()]
      .sort((first, second) => second.createdTimeMs - first.createdTimeMs);
    responses.writeJson(res, ctx, summaries);
  }
}
