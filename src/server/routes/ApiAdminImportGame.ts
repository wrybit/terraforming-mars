import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {readBody} from './readBody';
import {AdminImportGameRequest} from '../../common/admin/AdminGameSummary';
import {ImportedGamesStore} from '../admin/ImportedGamesStore';
import {ImportedSnapshotsStore} from '../admin/ImportedSnapshotsStore';
import {ImportedGame, importExternalGame, JsonFetcher, fetchJson} from '../admin/importExternalGame';

/** Holt ein beendetes Spiel von einem fremden Server (z. B. herokuapp) und legt es dauerhaft hier ab. */
export class ApiAdminImportGame extends Handler {
  public static readonly INSTANCE = new ApiAdminImportGame();
  constructor(
    private readonly importedGames: ImportedGamesStore = ImportedGamesStore.getInstance(),
    private readonly snapshots: ImportedSnapshotsStore = ImportedSnapshotsStore.getInstance(),
    private readonly fetcher: JsonFetcher = fetchJson) {
    super({validateServerId: true});
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const {url} = JSON.parse(await readBody(req)) as AdminImportGameRequest;
    let imported: ImportedGame;
    try {
      imported = await importExternalGame(url ?? '', this.fetcher);
    } catch (error) {
      throw RouteError.badRequest(error instanceof Error ? error.message : String(error));
    }
    if (this.importedGames.has(imported.summary.id)) {
      throw RouteError.badRequest('This game was already imported');
    }
    // Erst der Endstand, dann die Übersicht: ein Eintrag ohne Endstand würde ins Leere verlinken
    this.snapshots.save(imported.snapshot);
    this.importedGames.add(imported.summary);
    responses.writeJson(res, ctx, imported.summary);
  }
}
