import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {AdminGameSummary} from '../../common/admin/AdminGameSummary';
import {localGameSummary} from '../admin/localGameSummary';
import {ImportedGamesStore} from '../admin/ImportedGamesStore';
import {withoutAiTrainingGames} from '../aiTraining/aiTrainingGameIds';

/** All games for the admin overview: own games and imported results, newest first. */
export class ApiAdminGames extends Handler {
  public static readonly INSTANCE = new ApiAdminGames();
  constructor(private readonly importedGames: ImportedGamesStore = ImportedGamesStore.getInstance()) {
    super({validateServerId: true});
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    // AI training games are only for watching from the lobby (aiTrainingGameIds.ts)
    const ledger = withoutAiTrainingGames(await ctx.gameLoader.getIds());
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
