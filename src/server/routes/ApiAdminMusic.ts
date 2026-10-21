import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {readBody} from './readBody';
import {MusicSettingsStore} from '../admin/musicSettingsStore';
import {MusicState, MusicSwitch} from '../../common/music/musicState';

/** Admin page "Music": switches one background track on or off (takes effect at once). */
export class ApiAdminMusic extends Handler {
  public static readonly INSTANCE = new ApiAdminMusic();
  constructor(private readonly store: MusicSettingsStore = MusicSettingsStore.getInstance()) {
    super({validateServerId: true});
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let update: MusicSwitch;
    try {
      update = JSON.parse(await readBody(req));
    } catch {
      throw RouteError.badRequest('invalid music switch');
    }
    if (typeof update?.id !== 'string' || typeof update?.enabled !== 'boolean') {
      throw RouteError.badRequest('invalid music switch');
    }
    const enabled = this.store.setEnabled(update.id, update.enabled);
    if (enabled === undefined) {
      throw RouteError.badRequest('unknown track ' + update.id);
    }
    const state: MusicState = {enabled};
    responses.writeJson(res, ctx, state);
  }
}
