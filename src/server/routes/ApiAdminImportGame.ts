import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {readBody} from './readBody';
import {AdminImportGameRequest} from '../../common/admin/AdminGameSummary';
import {ImportedGamesStore} from '../admin/ImportedGamesStore';
import {importExternalGame, JsonFetcher, fetchJson} from '../admin/importExternalGame';

/** Holt das Ergebnis eines Spiels von einem fremden Server (z. B. herokuapp) und legt es in der Übersicht ab. */
export class ApiAdminImportGame extends Handler {
  public static readonly INSTANCE = new ApiAdminImportGame();
  constructor(
    private readonly importedGames: ImportedGamesStore = ImportedGamesStore.getInstance(),
    private readonly fetcher: JsonFetcher = fetchJson) {
    super({validateServerId: true});
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const {url} = JSON.parse(await readBody(req)) as AdminImportGameRequest;
    let summary;
    try {
      summary = await importExternalGame(url ?? '', this.fetcher);
    } catch (error) {
      throw RouteError.badRequest(error instanceof Error ? error.message : String(error));
    }
    if (this.importedGames.has(summary.id)) {
      throw RouteError.badRequest('This game was already imported');
    }
    this.importedGames.add(summary);
    responses.writeJson(res, ctx, summary);
  }
}
