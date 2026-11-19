import {Handler} from './Handler';
import {Context} from './IHandler';
import {ServeApp} from './ServeApp';
import {Request} from '../Request';
import {Response} from '../Response';

/**
 * The single-card view (CardView.vue) may be embedded by other sites: the AI hub shows a card on hover in a frame.
 * It holds no game or player data, so the click-jacking guard of every other page (X-Frame-Options SAMEORIGIN,
 * securityHeaders.ts) is lifted here only.
 */
export class ServeCardView extends Handler {
  public static readonly INSTANCE = new ServeCardView();
  private constructor() {
    super();
  }
  public override get(req: Request, res: Response, ctx: Context): Promise<void> {
    // frame-ancestors overrides X-Frame-Options in browsers that know CSP (all current ones)
    res.setHeader('Content-Security-Policy', 'frame-ancestors *');
    return ServeApp.INSTANCE.get(req, res, ctx);
  }
}
