import * as path from 'path';
import {createHash} from 'crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {paths} from '../../common/app/paths';

// Logo of the admin dashboard (SERVER_LOGO_IMAGE): an uploaded image lives in the db folder, which in Docker is
// the data volume – so it survives updates. The .env only holds its address.
const defaultFolder = path.resolve(process.cwd(), './db/server-logo');

// Raster formats only: an SVG may carry scripts and would run on this origin
const CONTENT_TYPES: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

// Hash + extension only: prevents paths like "../" from the URL
const fileNamePattern = /^logo-[0-9a-f]{16}\.(png|jpg|webp|gif|avif)$/;

export type StoredServerLogo = {data: Buffer, contentType: string};

export class ServerLogoStore {
  private static instance: ServerLogoStore | undefined;

  constructor(private readonly folder: string = defaultFolder) {}

  public static getInstance(): ServerLogoStore {
    ServerLogoStore.instance ??= new ServerLogoStore();
    return ServerLogoStore.instance;
  }

  /** Saves the image and returns the address to put into SERVER_LOGO_IMAGE; undefined for other formats. */
  public save(data: Buffer, contentType: string): string | undefined {
    const extension = Object.keys(CONTENT_TYPES).find((key) => CONTENT_TYPES[key] === contentType);
    if (extension === undefined) {
      return undefined;
    }
    // Named by content: the same image keeps its address, a new one gets a new address (no stale browser cache)
    const fileName = `logo-${createHash('sha256').update(data).digest('hex').slice(0, 16)}.${extension}`;
    mkdirSync(this.folder, {recursive: true});
    writeFileSync(path.resolve(this.folder, fileName), data);
    return `${paths.API_ADMIN_SERVER_LOGO}?file=${fileName}`;
  }

  public get(fileName: string): StoredServerLogo | undefined {
    if (!fileNamePattern.test(fileName)) {
      return undefined;
    }
    const file = path.resolve(this.folder, fileName);
    if (!existsSync(file)) {
      return undefined;
    }
    return {data: readFileSync(file), contentType: CONTENT_TYPES[path.extname(fileName).slice(1)]};
  }
}
