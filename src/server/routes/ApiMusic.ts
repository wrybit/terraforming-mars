import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {MusicSettingsStore} from '../admin/musicSettingsStore';
import {MusicState} from '../../common/music/musicState';

/** Background tracks that may play (switched on in the admin page); open to every player. */
export class ApiMusic extends Handler {
  public static readonly INSTANCE = new ApiMusic();
  constructor(private readonly store: MusicSettingsStore = MusicSettingsStore.getInstance()) {
    super();
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const state: MusicState = {enabled: this.store.enabled()};
    responses.writeJson(res, ctx, state);
    return Promise.resolve();
  }
}
