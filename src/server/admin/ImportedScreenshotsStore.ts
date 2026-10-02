import * as path from 'path';
import {existsSync, readFileSync} from 'fs';

// Screenshots of results pages whose games no longer exist anywhere (taken from the Discord history).
// Discord attachment links expire after a day – so the images live here, in the db folder and thus
// on mint in the Docker volume. The file name is the Discord message ID.
const defaultFolder = path.resolve(process.cwd(), './db/imported/screenshots');

// Digits only (Discord IDs): prevents paths like "../" from the URL
const screenshotIdPattern = /^[0-9]{5,25}$/;

export class ImportedScreenshotsStore {
  private static instance: ImportedScreenshotsStore | undefined;

  constructor(private readonly folder: string = defaultFolder) {}

  public static getInstance(): ImportedScreenshotsStore {
    ImportedScreenshotsStore.instance ??= new ImportedScreenshotsStore();
    return ImportedScreenshotsStore.instance;
  }

  /** JPEG data of the screenshot, or undefined if the ID is invalid or there is no image. */
  public get(id: string): Buffer | undefined {
    if (!screenshotIdPattern.test(id)) {
      return undefined;
    }
    const filename = path.resolve(this.folder, `${id}.jpg`);
    return existsSync(filename) ? readFileSync(filename) : undefined;
  }
}
