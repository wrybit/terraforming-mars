import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {readBody} from './readBody';
import {RouteError} from './RouteError';
import {LobbyPush} from '../lobby/LobbyPush';
import {isParticipantId} from '../../common/lobby/LobbyModel';
import {LOBBY_PUSH_KINDS, LOBBY_PUSH_TEST_TAG, LobbyPushKind} from '../../common/lobby/LobbyPushModel';
import {AdminPushTestRequest, AdminPushTestResponse} from '../../common/admin/AdminPushModel';

// Name in the test messages: stands for whoever caused the message
const TEST_NAME = 'Bob';

/** Admin page "Push": GET subscriptions and latest deliveries, POST sends a test message to the admin's own browser */
export class ApiAdminPush extends Handler {
  public static readonly INSTANCE = new ApiAdminPush();

  constructor(private readonly push: LobbyPush = LobbyPush.INSTANCE) {
    super({validateServerId: true});
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    responses.writeJson(res, ctx, this.push.info());
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let body: Partial<AdminPushTestRequest>;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      throw RouteError.badRequest('Invalid request');
    }
    if (!isParticipantId(body?.me) || !LOBBY_PUSH_KINDS.includes(body?.kind as LobbyPushKind)) {
      throw RouteError.badRequest('Invalid request');
    }
    // Opens the lobby on a click; stays out of the list of deliveries
    const result = await this.push.notify(body.me, body.kind as LobbyPushKind, {id: LOBBY_PUSH_TEST_TAG.replace(/^lobby-/, ''), path: 'lobby', title: 'Test'}, TEST_NAME, false);
    const response: AdminPushTestResponse = {result};
    responses.writeJson(res, ctx, response);
  }
}
