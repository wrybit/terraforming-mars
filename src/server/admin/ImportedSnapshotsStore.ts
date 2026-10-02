import * as path from 'path';
import {existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync} from 'fs';
import {LogMessage} from '../../common/logs/LogMessage';
import {ViewModel} from '../../common/models/PlayerModel';
import {isImportableParticipantId} from './isImportableParticipantId';

/** Complete final state of an imported game, as the foreign server showed it to the participant. */
export type ImportedSnapshot = {
  participantId: string;
  view: ViewModel;
  /** Log per generation, as the results page lazy-loads it generation by generation. */
  logsByGeneration: Record<number, Array<LogMessage>>;
};

// One file per import: the views are large (all cards of all players), the overview shouldn't load them too.
// Lives in the db folder so on mint it ends up in the Docker volume and survives rebuilds.
const defaultFolder = path.resolve(process.cwd(), './db/imported');

export class ImportedSnapshotsStore {
  private static instance: ImportedSnapshotsStore | undefined;

  constructor(private readonly folder: string = defaultFolder) {}

  public static getInstance(): ImportedSnapshotsStore {
    ImportedSnapshotsStore.instance ??= new ImportedSnapshotsStore();
    return ImportedSnapshotsStore.instance;
  }

  /** Tests redirect the routes to a temp folder instead of writing into the real db folder. */
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

  // Only strict participant IDs become file names – prevents paths like "../" from the URL
  private filename(participantId: string): string | undefined {
    if (!isImportableParticipantId(participantId)) {
      return undefined;
    }
    return path.resolve(this.folder, `${participantId}.json`);
  }
}
