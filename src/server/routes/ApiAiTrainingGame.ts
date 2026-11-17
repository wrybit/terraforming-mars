import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {paths} from '../../common/app/paths';
import {SELFPLAY_GAME_PARAM, SELFPLAY_MACHINE_PARAM} from '../../common/aiTraining/selfplayArchive';
import {databaseKeeper} from '../aiTraining/AiTrainingGames';
import {SelfplayArchive} from '../aiTraining/selfplayArchive';

// Archive ids are file names on the hub: letters, digits, dash, underscore, dot
const ARCHIVE_ID = /^[\w.-]{1,80}$/;

/** Opens an archived self-play game of the new AI: imported on first use, then its real result page */
export class ApiAiTrainingGame extends Handler {
  public static readonly INSTANCE = new ApiAiTrainingGame();
  private constructor(private readonly archive: () => SelfplayArchive = () => SelfplayArchive.getInstance()) {
    super();
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const machine = ctx.urlParams.stringOrUndefined(SELFPLAY_MACHINE_PARAM) ?? '';
    const gameId = ctx.urlParams.stringOrUndefined(SELFPLAY_GAME_PARAM) ?? '';
    if (!ARCHIVE_ID.test(machine) || !ARCHIVE_ID.test(gameId)) {
      throw RouteError.badRequest('Invalid self-play game');
    }
    const archive = this.archive();
    if (!archive.available) {
      throw RouteError.notFound('This server shows no self-play games');
    }
    let spectatorId;
    try {
      spectatorId = await archive.open({machine, gameId}, databaseKeeper(ctx.gameLoader));
    } catch (error) {
      console.error(`Could not open self-play game ${machine}/${gameId}`, error);
      throw RouteError.notFound('Self-play game not found');
    }
    responses.redirect(res, `${paths.THE_END}?id=${spectatorId}`);
  }
}
