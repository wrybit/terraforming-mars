import * as path from 'path';
import {existsSync, readFileSync} from 'fs';
import {StatsGameDetails} from '../../common/stats/StatsGame';

/** Aus einem Screenshot der Ergebnisseite abgelesene Angaben (Punkteaufschlüsselung, Karten, Diagramme …). */
export type ScreenshotDetails = {
  screenshotId: string;
  /** Spiel-ID aus dem Log des Screenshots, falls sichtbar. */
  gameId: string | undefined;
  details: StatsGameDetails;
};

// Eine Datei je Screenshot neben den Screenshots selbst, im Docker-Volume auf mint – wie die übrigen Importe.
// Erzeugt wird sie außerhalb des Servers (Auswertung der Screenshots); der Server liest sie nur.
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
    // Nur Ziffern: die ID landet im Dateinamen
    if (!SCREENSHOT_ID.test(screenshotId)) {
      return undefined;
    }
    const filename = path.resolve(this.folder, `${screenshotId}.json`);
    return existsSync(filename) ? JSON.parse(readFileSync(filename, 'utf8')) : undefined;
  }
}
