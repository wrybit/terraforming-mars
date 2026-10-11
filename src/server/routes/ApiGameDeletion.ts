import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {findDeletedGame} from '../database/deletedGamesLog';

/**
 * Fragt der Client, wenn eine Partie nicht (mehr) da ist: Wurde sie geloescht, wann und warum?
 * Akzeptiert Spiel-, Spieler- und Zuschauer-IDs, weil Links jede davon enthalten koennen.
 */
export class ApiGameDeletion extends Handler {
  public static readonly INSTANCE = new ApiGameDeletion();
  private constructor() {
    super();
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const id = ctx.urlParams.stringOrUndefined('id') ?? '';
    responses.writeJson(res, ctx, findDeletedGame(id));
    return Promise.resolve();
  }
}
