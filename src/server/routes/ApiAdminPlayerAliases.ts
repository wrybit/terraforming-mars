import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {readBody} from './readBody';
import {RouteError} from './RouteError';
import {PlayerAliasesStore} from '../stats/PlayerAliasesStore';
import {cachedStatsGames, forgetCachedStatsGames} from '../stats/statsGamesCache';
import {defaultPlayerNames} from '../stats/defaultPlayerNames';
import {AdminPlayerAliasesInfo} from '../../common/admin/PlayerAliases';
import {PlayerAppearanceStore} from '../stats/PlayerAppearanceStore';
import {isLobbyEmoji, isPlayerColor} from '../../common/admin/PlayerAppearance';

const isName = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/** Admin page "Players": GET the merged names and looks, POST merges two names, undoes a merge or sets a look. */
export class ApiAdminPlayerAliases extends Handler {
  public static readonly INSTANCE = new ApiAdminPlayerAliases();

  constructor(
    private readonly store: PlayerAliasesStore = PlayerAliasesStore.getInstance(),
    private readonly appearances: PlayerAppearanceStore = PlayerAppearanceStore.getInstance(),
  ) {
    super({validateServerId: true});
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    this.writeInfo(res, ctx);
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let body: Partial<{action: string, from: unknown, to: unknown, permanent: unknown, id: unknown, name: unknown, color: unknown, emoji: unknown}>;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      throw RouteError.badRequest('Invalid request');
    }
    let done = false;
    if (body?.action === 'merge' && isName(body.from) && isName(body.to) && typeof body.permanent === 'boolean') {
      done = this.store.merge(body.from, body.to, body.permanent ? undefined : await this.gamesOf(body.from, ctx));
    } else if (body?.action === 'unmerge' && isName(body.id)) {
      done = this.store.unmerge(body.id);
    } else if (body?.action === 'appearance' && isName(body.name) &&
      (body.color === undefined || isPlayerColor(body.color)) && (body.emoji === undefined || isLobbyEmoji(body.emoji))) {
      this.appearances.set({name: body.name, color: body.color, emoji: body.emoji});
      done = true;
    }
    if (!done) {
      throw RouteError.badRequest('Invalid request');
    }
    // The statistics page shows the new names right away, not only after the cache minute
    forgetCachedStatsGames();
    this.writeInfo(res, ctx);
  }

  /** One-time merge: the games the name has right now, as the list shows it (finished just now included). */
  private async gamesOf(name: string, ctx: Context): Promise<Array<string>> {
    forgetCachedStatsGames();
    const games = await cachedStatsGames(ctx.gameLoader);
    return games.filter((game) => game.summary.players.some((player) => player.name === name)).map((game) => game.summary.id);
  }

  private writeInfo(res: Response, ctx: Context): void {
    const info: AdminPlayerAliasesInfo = {aliases: this.store.list(), defaultNames: defaultPlayerNames(), appearances: this.appearances.list()};
    responses.writeJson(res, ctx, info);
  }
}
