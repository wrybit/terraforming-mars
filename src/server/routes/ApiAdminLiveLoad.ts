import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {LiveLoad} from '../admin/dashboard/liveLoad';
import {rustBotProcessIds} from '../ai/rust/rustBotProcessIds';

/** Admin page, AI tab: processor and memory of the machine right now, polled every second for the live graph. */
export class ApiAdminLiveLoad extends Handler {
  public static readonly INSTANCE = new ApiAdminLiveLoad();

  constructor(private readonly liveLoad: LiveLoad = new LiveLoad(rustBotProcessIds)) {
    super({validateServerId: true});
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    responses.writeJson(res, ctx, await this.liveLoad.sample());
  }
}
