import * as fs from 'fs';
import * as path from 'path';
import * as responses from '../server/responses';
import {Context} from './IHandler';
import {Handler} from './Handler';
import {Request} from '../Request';
import {Response} from '../Response';
import {paths} from '../../common/app/paths';

const INSTALL_DIRECTORY = path.resolve('scripts', 'install');

/** File served for each route; /install picks by the client (see fileFor). */
const FILES: Record<string, string> = {
  [paths.INSTALL_SH]: 'install.sh',
  [paths.INSTALL_PS1]: 'install.ps1',
};

/**
 * Serves the one-command installer, so a short address is enough:
 *   curl https://<server>/install | sh     (Linux, macOS)
 *   irm https://<server>/install | iex     (Windows PowerShell)
 * PowerShell gets install.ps1; everyone else a small POSIX launcher, because `sh` is not bash on
 * Debian/Ubuntu and install.sh needs bash.
 */
export class InstallScript extends Handler {
  public static readonly INSTANCE = new InstallScript();
  private constructor() {
    super();
  }

  public static fileFor(pathname: string, userAgent: string | undefined): string {
    const file = FILES[pathname];
    if (file !== undefined) {
      return file;
    }
    return /PowerShell/i.test(userAgent ?? '') ? 'install.ps1' : 'launcher.sh';
  }

  public override async get(req: Request, res: Response, ctx: Context): Promise<void> {
    const pathname = ctx.url.pathname.replace(/^\/+|\/+$/g, '');
    const file = InstallScript.fileFor(pathname, req.headers['user-agent']);
    let content: Buffer;
    try {
      content = await fs.promises.readFile(path.join(INSTALL_DIRECTORY, file));
    } catch {
      responses.notFound(req, res, `Installer file ${file} is missing on this server`);
      return;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    // Always the installer of the running server version
    res.setHeader('Cache-Control', 'no-cache');
    res.end(content);
  }
}
