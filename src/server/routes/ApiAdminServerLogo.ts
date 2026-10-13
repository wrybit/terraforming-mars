import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {MAX_BODY_BYTES, readBody} from './readBody';
import {ServerLogoStore} from '../admin/serverLogoStore';

// "data:image/png;base64,…" as the browser's FileReader delivers it
const dataUrlPattern = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/;

/** Logo of the admin dashboard: upload an image (POST) and show it (GET ?file=). */
export class ApiAdminServerLogo extends Handler {
  public static readonly INSTANCE = new ApiAdminServerLogo();
  constructor(private readonly store: ServerLogoStore = ServerLogoStore.getInstance()) {
    super({validateServerId: true});
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const logo = this.store.get(ctx.url.searchParams.get('file') ?? '');
    if (logo === undefined) {
      throw RouteError.notFound('logo not found');
    }
    res.setHeader('Content-Type', logo.contentType);
    // The file name contains the hash of its content: it never changes
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
    res.write(logo.data);
    res.end();
    return Promise.resolve();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const match = dataUrlPattern.exec((await readBody(req, MAX_BODY_BYTES)).trim());
    if (match === null) {
      throw RouteError.badRequest('expected an image as data URL');
    }
    const address = this.store.save(Buffer.from(match[2], 'base64'), match[1]);
    if (address === undefined) {
      throw RouteError.badRequest(`unsupported image type ${match[1]}: use PNG, JPEG, WebP, GIF or AVIF`);
    }
    responses.writeJson(res, ctx, {address});
  }
}
