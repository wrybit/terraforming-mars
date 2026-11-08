import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {readBody} from './readBody';
import {RouteError} from './RouteError';
import {PlayerAliasesStore} from '../stats/PlayerAliasesStore';
import {forgetCachedStatsGames} from '../stats/statsGamesCache';
import {AdminPlayerAliasesInfo, AdminPlayerAliasRequest} from '../../common/admin/PlayerAliases';

const isName = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/** Admin page "Players": GET the merged names, POST merges two names or undoes a merge. */
export class ApiAdminPlayerAliases extends Handler {
  public static readonly INSTANCE = new ApiAdminPlayerAliases();

  constructor(private readonly store: PlayerAliasesStore = PlayerAliasesStore.getInstance()) {
    super({validateServerId: true});
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    this.writeInfo(res, ctx);
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let body: Partial<AdminPlayerAliasRequest> & {to?: unknown};
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      throw RouteError.badRequest('Invalid request');
    }
    const done =
      body?.action === 'merge' && isName(body.from) && isName(body.to) ? this.store.merge(body.from, body.to) :
        body?.action === 'unmerge' && isName(body.from) ? this.store.unmerge(body.from) :
          false;
    if (!done) {
      throw RouteError.badRequest('Invalid request');
    }
    // The statistics page shows the new names right away, not only after the cache minute
    forgetCachedStatsGames();
    this.writeInfo(res, ctx);
  }

  private writeInfo(res: Response, ctx: Context): void {
    const info: AdminPlayerAliasesInfo = {aliases: this.store.list()};
    responses.writeJson(res, ctx, info);
  }
}
