import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {readBody} from './readBody';
import {RouteError} from './RouteError';
import {LobbyChat} from '../lobby/LobbyChat';
import {LobbyError} from '../lobby/lobbyValidation';
import {isParticipantId} from '../../common/lobby/LobbyModel';

/** Lobby chat (server/lobby/LobbyChat.ts): GET the messages (?me=), POST {me, profile, text} writes one */
export class ApiLobbyChat extends Handler {
  public static readonly INSTANCE = new ApiLobbyChat();

  constructor(private readonly chat: LobbyChat = LobbyChat.INSTANCE) {
    super();
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const me = ctx.urlParams.stringOrUndefined('me');
    responses.writeJson(res, ctx, this.chat.list(isParticipantId(me) ? me : undefined));
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let body: {me?: unknown, profile?: unknown, text?: unknown};
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      throw RouteError.badRequest('Invalid request');
    }
    if (!isParticipantId(body?.me)) {
      throw RouteError.badRequest('Invalid participant');
    }
    try {
      responses.writeJson(res, ctx, this.chat.post(body.me, body.profile, body.text, req.headers.host));
    } catch (error) {
      if (error instanceof LobbyError) {
        throw RouteError.badRequest(error.message);
      }
      throw error;
    }
  }
}
