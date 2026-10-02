import * as path from 'path';
import {existsSync, readFileSync} from 'fs';
import {StatsGameDetails} from '../../common/stats/StatsGame';

/** Data read from a screenshot of the results page (points breakdown, cards, charts …). */
export type ScreenshotDetails = {
  screenshotId: string;
  /** Game ID from the screenshot's log, if visible. */
  gameId: string | undefined;
  details: StatsGameDetails;
};

// One file per screenshot next to the screenshots themselves, in the Docker volume on mint – like the other imports.
// It is produced outside the server (screenshot analysis); the server only reads it.
const defaultFolder = path.resolve(process.cwd(), './db/imported/screenshot-details');

const SCREENSHOT_ID = /^[0-9]{1,30}$/;

export class ScreenshotDetailsStore {
  private static instance: ScreenshotDetailsStore | undefined;

  constructor(private readonly folder: string = defaultFolder) {}

  public static getInstance(): ScreenshotDetailsStore {
    ScreenshotDetailsStore.instance ??= new ScreenshotDetailsStore();
    return ScreenshotDetailsStore.instance;
  }

  public get(screenshotId: string): ScreenshotDetails | undefined {
    // Digits only: the ID ends up in the file name
    if (!SCREENSHOT_ID.test(screenshotId)) {
      return undefined;
    }
    const filename = path.resolve(this.folder, `${screenshotId}.json`);
    return existsSync(filename) ? JSON.parse(readFileSync(filename, 'utf8')) : undefined;
  }
}
