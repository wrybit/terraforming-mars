import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {ImportedScreenshotsStore} from '../admin/ImportedScreenshotsStore';

// Bilder ändern sich nie (ein Screenshot je Discord-Nachricht) – der Browser darf sie lange behalten
const cacheSeconds = 30 * 24 * 60 * 60;

/** Liefert den gespeicherten Screenshot einer Ergebnisseite – öffentlich wie die Ergebnisseiten selbst. */
export class ImportedScreenshot extends Handler {
  public static readonly INSTANCE = new ImportedScreenshot();
  constructor(private readonly screenshots: ImportedScreenshotsStore = ImportedScreenshotsStore.getInstance()) {
    super();
  }

  public override get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const image = this.screenshots.get(ctx.url.searchParams.get('id') ?? '');
    if (image === undefined) {
      throw RouteError.notFound('screenshot not found');
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${cacheSeconds}, immutable`);
    res.write(image);
    res.end();
    return Promise.resolve();
  }
}
