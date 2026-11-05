import * as fs from 'fs';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {withServerIdentity} from '../server/serverIdentity';

/**
 * The app page at lobby/room/<id>-<name> (common/lobby/lobbyUrl.ts). The page loads everything with relative
 * addresses (scripts, styles, api/...); two folders deep these would point into lobby/room/. A base two levels
 * up keeps them working, also when the app runs behind a path prefix.
 */
export class LobbyRoomPage extends Handler {
  public static readonly INSTANCE = new LobbyRoomPage();
  private constructor() {
    super();
  }

  public override get(_req: Request, res: Response, _ctx: Context): Promise<void> {
    const html = withServerIdentity(fs.readFileSync('assets/index.html', 'utf8'))
      .replace('<head>', '<head>\n        <base href="../../">');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(html);
    return Promise.resolve();
  }
}
