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
import {GameId, ParticipantId} from '../../common/Types';
import {Game} from '../Game';
import {IGame} from '../IGame';
import {ReplayGames} from '../extensions/ServerExtension';
import {SERVER_EXTENSIONS} from '../../genfiles/extensionsServer';

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
      // Not in the database: maybe a game an extension keeps outside of it (e.g. games received from other servers)
      const outside = await replayGamesOutsideDatabase(id);
      if (outside === undefined) {
        throw RouteError.notFound(`game ${id} not found on this server (deleted or imported from another server)`);
      }
      writeReplay(res, ctx, outside.start, Game.deserialize(outside.end));
      return;
    }
    if (game.phase !== Phase.END) {
      throw RouteError.badRequest(`game ${game.id} is not finished yet`);
    }
    // Without a saved start (imported or copied games) the end serves as start: replaySource then takes the values
    // every game starts with – less exact, but the replay stays possible
    writeReplay(res, ctx, await firstSave(game.id) ?? game.serialize(), game);
  }
}

function writeReplay(res: Response, ctx: Context, start: SerializedGame, end: IGame): void {
  responses.writeJson(res, ctx, replaySource(start, end.serialize(), end.standardProjects.map((card) => card.name)));
}

// First extension that knows the game; only finished games, as for those from the database
async function replayGamesOutsideDatabase(id: ParticipantId): Promise<ReplayGames | undefined> {
  for (const extension of SERVER_EXTENSIONS) {
    const found = await extension.replayGames?.(id);
    if (found !== undefined && found.end.phase === Phase.END) {
      return found;
    }
  }
  return undefined;
}

// Earliest save of the game. Imported or copied games do not start at save 0 but at the save number they brought
// along – hence the smallest one there is instead of always 0
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
