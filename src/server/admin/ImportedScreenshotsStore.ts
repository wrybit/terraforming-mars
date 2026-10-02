import * as path from 'path';
import {existsSync, readFileSync} from 'fs';

// Screenshots von Ergebnisseiten, deren Spiele es nirgends mehr gibt (aus dem Discord-Verlauf übernommen).
// Discord-Links auf Anhänge laufen nach einem Tag ab – deshalb liegen die Bilder hier, im db-Ordner und damit
// auf mint im Docker-Volume. Dateiname ist die Discord-Nachrichten-ID.
const defaultFolder = path.resolve(process.cwd(), './db/imported/screenshots');

// Nur Ziffern (Discord-IDs): verhindert Pfade wie "../" aus der URL
const screenshotIdPattern = /^[0-9]{5,25}$/;

export class ImportedScreenshotsStore {
  private static instance: ImportedScreenshotsStore | undefined;

  constructor(private readonly folder: string = defaultFolder) {}

  public static getInstance(): ImportedScreenshotsStore {
    ImportedScreenshotsStore.instance ??= new ImportedScreenshotsStore();
    return ImportedScreenshotsStore.instance;
  }

  /** JPEG-Daten des Screenshots oder undefined, wenn die ID ungültig ist oder es kein Bild gibt. */
  public get(id: string): Buffer | undefined {
    if (!screenshotIdPattern.test(id)) {
      return undefined;
    }
    const filename = path.resolve(this.folder, `${id}.jpg`);
    return existsSync(filename) ? readFileSync(filename) : undefined;
  }
}
