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

/** Nur im lokalen Netz: löscht ein eigenes Spiel endgültig aus Speicher und Datenbank oder entfernt ein importiertes Ergebnis. */
export class ApiAdminDeleteGame extends Handler {
  public static readonly INSTANCE = new ApiAdminDeleteGame();
  constructor(
    private readonly importedGames: ImportedGamesStore = ImportedGamesStore.getInstance(),
    private readonly snapshots: ImportedSnapshotsStore = ImportedSnapshotsStore.getInstance()) {
    super({validateServerId: true});
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    // Nur über die Heimnetz-Adresse: wer die Seite über DuckDNS öffnet, soll nichts löschen können
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
