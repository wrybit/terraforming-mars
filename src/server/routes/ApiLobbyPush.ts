import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {readBody} from './readBody';
import {RouteError} from './RouteError';
import {LobbyPush} from '../lobby/LobbyPush';
import {LobbyError} from '../lobby/lobbyValidation';
import {isParticipantId} from '../../common/lobby/LobbyModel';
import {LobbyPushInfo, LobbyPushRequest} from '../../common/lobby/LobbyPushModel';

/** Push messages of the lobby (server/lobby/LobbyPush.ts): GET the public key, POST {me, subscription, texts} (un)subscribes */
export class ApiLobbyPush extends Handler {
  public static readonly INSTANCE = new ApiLobbyPush();

  constructor(private readonly push: LobbyPush = LobbyPush.INSTANCE) {
    super();
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const info: LobbyPushInfo = {publicKey: this.push.publicKey()};
    responses.writeJson(res, ctx, info);
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let body: Partial<LobbyPushRequest>;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      throw RouteError.badRequest('Invalid request');
    }
    if (!isParticipantId(body?.me)) {
      throw RouteError.badRequest('Invalid participant');
    }
    try {
      this.push.subscribe(body.me, body.subscription ?? null, body.texts, body.muted);
    } catch (error) {
      if (error instanceof LobbyError) {
        throw RouteError.badRequest(error.message);
      }
      throw error;
    }
    responses.writeJson(res, ctx, {ok: true});
  }
}
