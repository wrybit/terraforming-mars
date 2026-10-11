import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {ServerStatusModel} from '../../common/models/ServerStatusModel';
import {isServerUpdating, serverStartedAt} from '../server/serverUpdate';
import {activeParticipantCount, noteActiveParticipant} from '../server/activeParticipants';
import {isPlayerId} from '../../common/Types';
import {Phase} from '../../common/Phase';

/** Polled by every open page (serverStatus.ts) and by update scripts on the server itself. */
export class ApiStatus extends Handler {
  public static readonly INSTANCE = new ApiStatus();
  private constructor() {
    super();
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    // Only players of a running game count: spectators and finished games do not hold back an update
    const id = ctx.urlParams.stringOrUndefined('id');
    if (id !== undefined && isPlayerId(id)) {
      const game = await ctx.gameLoader.getGame(id);
      if (game !== undefined && game.phase !== Phase.END) {
        noteActiveParticipant(id);
      }
    }
    const status: ServerStatusModel = {
      updating: isServerUpdating(),
      startedAt: serverStartedAt,
      activeParticipants: activeParticipantCount(),
    };
    responses.writeJson(res, ctx, status);
  }
}
