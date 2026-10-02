import * as path from 'path';
import {existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync} from 'fs';
import {LogMessage} from '../../common/logs/LogMessage';
import {ViewModel} from '../../common/models/PlayerModel';
import {isImportableParticipantId} from './isImportableParticipantId';

/** Vollständiger Endstand eines importierten Spiels, so wie der fremde Server ihn dem Teilnehmer gezeigt hat. */
export type ImportedSnapshot = {
  participantId: string;
  view: ViewModel;
  /** Log je Generation, wie es die Ergebnisseite generationsweise nachlädt. */
  logsByGeneration: Record<number, Array<LogMessage>>;
};

// Eine Datei je Import: die Ansichten sind groß (alle Karten aller Spieler), die Übersicht soll sie nicht mitladen.
// Liegt im db-Ordner, damit sie auf mint im Docker-Volume landet und Neubauten übersteht.
const defaultFolder = path.resolve(process.cwd(), './db/imported');

export class ImportedSnapshotsStore {
  private static instance: ImportedSnapshotsStore | undefined;

  constructor(private readonly folder: string = defaultFolder) {}

  public static getInstance(): ImportedSnapshotsStore {
    ImportedSnapshotsStore.instance ??= new ImportedSnapshotsStore();
    return ImportedSnapshotsStore.instance;
  }

  /** Tests lenken die Routen auf einen Temp-Ordner um, statt in den echten db-Ordner zu schreiben. */
  public static setInstanceForTesting(store: ImportedSnapshotsStore | undefined): void {
    ImportedSnapshotsStore.instance = store;
  }

  public get(participantId: string): ImportedSnapshot | undefined {
    const filename = this.filename(participantId);
    if (filename === undefined || !existsSync(filename)) {
      return undefined;
    }
    return JSON.parse(readFileSync(filename, 'utf8'));
  }

  public save(snapshot: ImportedSnapshot): void {
    const filename = this.filename(snapshot.participantId);
    if (filename === undefined) {
      throw new Error('Invalid participant id ' + snapshot.participantId);
    }
    mkdirSync(this.folder, {recursive: true});
    writeFileSync(filename, JSON.stringify(snapshot));
  }

  public remove(participantId: string): void {
    const filename = this.filename(participantId);
    if (filename !== undefined && existsSync(filename)) {
      unlinkSync(filename);
    }
  }

  // Nur strenge Teilnehmer-IDs werden zu Dateinamen – verhindert Pfade wie "../" aus der URL
  private filename(participantId: string): string | undefined {
    if (!isImportableParticipantId(participantId)) {
      return undefined;
    }
    return path.resolve(this.folder, `${participantId}.json`);
  }
}
