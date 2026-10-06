import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {BoardName} from '../../common/boards/BoardName';
import {emptyBoardSpaces} from '../stats/emptyBoardSpaces';
import {RANDOM_BOARD, StatsBoardKey} from '../../common/stats/statsBoardKey';

// Shuffled boards count as their own board "random" in the statistics
const BOARD_KEYS = new Set<string>([...Object.values(BoardName), RANDOM_BOARD]);

/** Empty game board for a board's detail page in the statistics (/stats). */
export class ApiStatsBoard extends Handler {
  public static readonly INSTANCE = new ApiStatsBoard();
  private constructor() {
    super();
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const name = ctx.url.searchParams.get('name') ?? '';
    if (!BOARD_KEYS.has(name)) {
      throw RouteError.badRequest('unknown board');
    }
    responses.writeJson(res, ctx, emptyBoardSpaces(name as StatsBoardKey));
    return Promise.resolve();
  }
}
