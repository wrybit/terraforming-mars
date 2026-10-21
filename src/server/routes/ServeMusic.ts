import * as fs from 'fs';
import * as path from 'path';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';

// Background music (assets/music/<id>.mp3, scripts/make-music.ts). Own handler because the browser asks for
// parts of the file (Range): Safari plays nothing without it, and a click on the waveform jumps there at once.
const musicFilePattern = /^assets\/music\/[a-z0-9-]+\.mp3$/;
const rangePattern = /^bytes=(\d*)-(\d*)$/;

export class ServeMusic extends Handler {
  public static readonly INSTANCE = new ServeMusic();
  private constructor() {
    super();
  }

  public static handles(pathname: string): boolean {
    return musicFilePattern.test(pathname);
  }

  public override get(req: Request, res: Response, ctx: Context): Promise<void> {
    const pathname = ctx.url.pathname.substring(1);
    if (!ServeMusic.handles(pathname)) {
      throw RouteError.notFound();
    }
    const file = path.resolve(pathname);
    let size: number;
    try {
      size = fs.statSync(file).size;
    } catch {
      throw RouteError.notFound();
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    // The files only change with a new release, then under the same name: one day is a fair compromise
    res.setHeader('Cache-Control', 'public, max-age=86400');

    let start = 0;
    let end = size - 1;
    const range = rangePattern.exec(String(req.headers.range ?? ''));
    if (range !== null && (range[1] !== '' || range[2] !== '')) {
      if (range[1] === '') {
        // "bytes=-500": the last 500 bytes
        start = Math.max(0, size - Number(range[2]));
      } else {
        start = Number(range[1]);
        end = range[2] === '' ? end : Math.min(end, Number(range[2]));
      }
      if (start > end || start >= size) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${size}`);
        res.end();
        return Promise.resolve();
      }
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    }
    res.setHeader('Content-Length', end - start + 1);
    return new Promise((resolve) => {
      const stream = fs.createReadStream(file, {start, end});
      stream.on('error', () => {
        res.end();
        resolve();
      });
      // Response offers no pipe (Response.ts); the files are a few MB, so plain writes are fine
      stream.on('data', (chunk) => res.write(chunk));
      stream.on('end', () => {
        res.end();
        resolve();
      });
    });
  }
}
