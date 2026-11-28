import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {Database} from '../database/Database';
import {Phase} from '../../common/Phase';
import {replaySource} from '../replay/replaySource';
import {SerializedGame} from '../SerializedGame';
import {GameId} from '../../common/Types';

// Raw material of a replay for the results page: start and end of a finished game (start = earliest save). Nothing extra is stored,
// the client reconstructs every step from the log (replay/reconstructReplay.ts).
export class ApiReplay extends Handler {
  public static readonly INSTANCE = new ApiReplay();
  private constructor() {
    super();
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const id = ctx.urlParams.participantId('id');
    const game = await ctx.gameLoader.getGame(id);
    if (game === undefined) {
      throw RouteError.notFound(`game ${id} not found on this server (deleted or imported from another server)`);
    }
    if (game.phase !== Phase.END) {
      throw RouteError.badRequest(`game ${game.id} is not finished yet`);
    }
    const end = game.serialize();
    // Ohne gespeicherten Start (importiert/kopiert) dient das Ende als Start: replaySource nimmt dann die Werte,
    // mit denen jede Partie beginnt – ungenauer, aber das Replay bleibt möglich
    const start = await firstSave(game.id) ?? end;
    responses.writeJson(res, ctx, replaySource(start, end, game.standardProjects.map((card) => card.name)));
  }
}

// Frühester Spielstand der Partie. Importierte oder kopierte Partien beginnen nicht bei Save 0, sondern bei ihrer
// mitgebrachten Save-Nummer – daher die kleinste vorhandene statt fest 0
async function firstSave(gameId: GameId): Promise<SerializedGame | undefined> {
  const database = Database.getInstance();
  try {
    const saveIds = await database.getSaveIds(gameId);
    if (saveIds.length === 0) {
      return undefined;
    }
    return await database.getGameVersion(gameId, Math.min(...saveIds));
  } catch {
    return undefined;
  }
}
