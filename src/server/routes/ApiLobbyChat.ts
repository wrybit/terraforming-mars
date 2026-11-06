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
import {LobbyChatModel} from '../../common/lobby/LobbyChatModel';

/** Lobby chat (server/lobby/LobbyChat.ts): GET the messages (?me=), POST {me, profile, text} writes one, PUT {me, id, text} changes one */
export class ApiLobbyChat extends Handler {
  public static readonly INSTANCE = new ApiLobbyChat();

  constructor(private readonly chat: LobbyChat = LobbyChat.INSTANCE) {
    super();
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const me = ctx.urlParams.stringOrUndefined('me');
    responses.writeJson(res, ctx, this.chat.list(isParticipantId(me) ? me : undefined, this.isServerIdValid(ctx)));
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const body = await readRequest(req);
    answer(res, ctx, () => this.chat.post(body.me, body.profile, body.text, req.headers.host));
  }

  // Admins (login cookie of the admin page) may change every message
  public override async put(req: Request, res: Response, ctx: Context): Promise<void> {
    const body = await readRequest(req);
    answer(res, ctx, () => this.chat.edit(body.me, body.id, body.text, req.headers.host, this.isServerIdValid(ctx)));
  }
}

type ChatRequest = {me: string, profile?: unknown, id?: unknown, text?: unknown};

async function readRequest(req: Request): Promise<ChatRequest> {
  let body: {me?: unknown, profile?: unknown, id?: unknown, text?: unknown};
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    throw RouteError.badRequest('Invalid request');
  }
  if (!isParticipantId(body?.me)) {
    throw RouteError.badRequest('Invalid participant');
  }
  return {...body, me: body.me};
}

// Refusals of the chat (empty, too long, too late …) go back as 400 with their text
function answer(res: Response, ctx: Context, action: () => LobbyChatModel): void {
  try {
    responses.writeJson(res, ctx, action());
  } catch (error) {
    if (error instanceof LobbyError) {
      throw RouteError.badRequest(error.message);
    }
    throw error;
  }
}
