import * as fs from 'fs';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {withServerIdentity} from '../server/serverIdentity';

/**
 * The app page at the lobby's own addresses below lobby/ (common/lobby/lobbyUrl.ts). The page loads everything
 * with relative addresses (scripts, styles, api/...); below lobby/ these would point into that folder. A base
 * back up to the app root keeps them working, also when the app runs behind a path prefix.
 */
export class LobbySubPage extends Handler {
  // lobby/room/<id>-<name>: two folders deep
  public static readonly ROOM = new LobbySubPage('../../');
  // lobby/create: one folder deep
  public static readonly CREATE = new LobbySubPage('../');
  private constructor(private readonly base: string) {
    super();
  }

  public override get(_req: Request, res: Response, _ctx: Context): Promise<void> {
    const html = withServerIdentity(fs.readFileSync('assets/index.html', 'utf8'))
      .replace('<head>', `<head>\n        <base href="${this.base}">`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(html);
    return Promise.resolve();
  }
}
