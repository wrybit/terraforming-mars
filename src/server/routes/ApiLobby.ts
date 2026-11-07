import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {readBody} from './readBody';
import {RouteError} from './RouteError';
import {ApiCreateGame} from './ApiCreateGame';
import {GameStarter, Lobby} from '../lobby/Lobby';
import {LobbyError} from '../lobby/lobbyValidation';
import {lobbyGameProgress} from '../lobby/lobbyGameProbe';
import {isParticipantId, LobbyAction} from '../../common/lobby/LobbyModel';

/**
 * Lobby (server/lobby/Lobby.ts): GET lists the open games and doubles as the heartbeat of the asking
 * participant (?me=); POST performs one action (common/lobby/LobbyModel.ts, LobbyAction).
 */
export class ApiLobby extends Handler {
  public static readonly INSTANCE = new ApiLobby();

  constructor(private readonly lobby: Lobby = Lobby.INSTANCE, private readonly createGame: ApiCreateGame = ApiCreateGame.INSTANCE) {
    super();
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const me = ctx.urlParams.stringOrUndefined('me');
    const roomId = ctx.urlParams.stringOrUndefined('room');
    responses.writeJson(res, ctx, await this.lobby.listWithProgress(isParticipantId(me) ? me : undefined, roomId, lobbyGameProgress(ctx.gameLoader)));
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let action: LobbyAction;
    try {
      action = JSON.parse(await readBody(req));
    } catch {
      throw RouteError.badRequest('Invalid request');
    }
    if (!isParticipantId(action?.me)) {
      throw RouteError.badRequest('Invalid participant');
    }
    // Same quota as the create form: a lobby game is created like any other game
    const starter: GameStarter = (config) => {
      if (!this.createGame.isWithinQuota(ctx)) {
        return Promise.reject(RouteError.badRequest('Too many new games right now. Please try again later.'));
      }
      return this.createGame.createGame(config, ctx);
    };
    try {
      responses.writeJson(res, ctx, await this.perform(action, starter));
    } catch (error) {
      if (error instanceof LobbyError) {
        throw RouteError.badRequest(error.message);
      }
      throw error;
    }
  }

  private perform(action: LobbyAction, starter: GameStarter): Promise<unknown> {
    switch (action.action) {
    case 'open':
      return this.lobby.open(action.me, action.profile, action.title, action.listed, action.config, starter, Array.isArray(action.freeSeats) ? action.freeSeats : []);
    case 'join':
      return this.lobby.join(action.me, action.profile, action.roomId, starter, typeof action.seatToken === 'string' ? action.seatToken : undefined);
    case 'edit':
      return Promise.resolve(this.lobby.edit(action.me, action.roomId, action.title, action.listed, action.config, Array.isArray(action.freeSeats) ? action.freeSeats : []));
    case 'profile':
      return Promise.resolve(this.lobby.updateProfile(action.me, action.profile, action.roomId));
    case 'leave':
      this.lobby.leave(action.me, action.roomId);
      return Promise.resolve({});
    case 'ready':
      return this.lobby.setReady(action.me, action.roomId, action.ready, starter);
    case 'seat-ai':
      return this.lobby.seatAi(action.me, action.roomId, Number(action.seat), starter);
    case 'remove':
      return Promise.resolve(this.lobby.removeSeat(action.me, action.roomId, Number(action.seat)));
    case 'approve':
      return this.lobby.approveRequest(action.me, action.roomId, String(action.participant), starter);
    case 'decline':
      return Promise.resolve(this.lobby.declineRequest(action.me, action.roomId, String(action.participant)));
    case 'ai-level':
      return Promise.resolve(this.lobby.setAiLevel(action.me, action.roomId, Number(action.seat), action.aiLevel));
    case 'fill-ai':
      return this.lobby.fillWithAi(action.me, action.roomId, starter);
    case 'start':
      return this.lobby.startNow(action.me, action.roomId, starter);
    default:
      throw RouteError.badRequest('Unknown lobby action');
    }
  }
}
