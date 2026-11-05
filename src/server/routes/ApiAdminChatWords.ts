import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {readBody} from './readBody';
import {RouteError} from './RouteError';
import {ChatWordList, DEFAULT_CHAT_WORDS, normalizeChatWords} from '../lobby/chatWords';
import {ChatWordsModel} from '../../common/lobby/LobbyChatModel';

/** Admin page: the words the lobby chat masks (server/lobby/chatWords.ts); a save applies at once */
export class ApiAdminChatWords extends Handler {
  public static readonly INSTANCE = new ApiAdminChatWords();

  constructor(private readonly list: ChatWordList = ChatWordList.INSTANCE) {
    super({validateServerId: true});
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const model: ChatWordsModel = {words: this.list.get(), defaults: normalizeChatWords([...DEFAULT_CHAT_WORDS])};
    responses.writeJson(res, ctx, model);
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let body: Partial<ChatWordsModel>;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      throw RouteError.badRequest('Invalid request');
    }
    if (!Array.isArray(body?.words)) {
      throw RouteError.badRequest('Invalid word list');
    }
    const model: ChatWordsModel = {words: this.list.set(body.words), defaults: normalizeChatWords([...DEFAULT_CHAT_WORDS])};
    responses.writeJson(res, ctx, model);
  }
}
