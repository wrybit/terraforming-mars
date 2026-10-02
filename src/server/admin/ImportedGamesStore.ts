import * as path from 'path';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {AdminGameSummary} from '../../common/admin/AdminGameSummary';

// Importierte Ergebnisse sind keine spielbaren Partien (der fremde Server liefert keinen vollständigen Spielstand).
// Deshalb eine eigene kleine JSON-Datei neben der Datenbank statt neuer Tabellen in allen Datenbank-Varianten –
// das hält den Fork beim Übernehmen von Upstream-Änderungen konfliktarm.
const defaultFilename = path.resolve(process.cwd(), './db/imported-games.json');

export class ImportedGamesStore {
  private static instance: ImportedGamesStore | undefined;

  constructor(private readonly filename: string = defaultFilename) {}

  public static getInstance(): ImportedGamesStore {
    ImportedGamesStore.instance ??= new ImportedGamesStore();
    return ImportedGamesStore.instance;
  }

  public list(): Array<AdminGameSummary> {
    if (!existsSync(this.filename)) {
      return [];
    }
    return JSON.parse(readFileSync(this.filename, 'utf8'));
  }

  public get(id: string): AdminGameSummary | undefined {
    return this.list().find((summary) => summary.id === id);
  }

  public has(id: string): boolean {
    return this.get(id) !== undefined;
  }

  public add(summary: AdminGameSummary): void {
    this.write([...this.list().filter((existing) => existing.id !== summary.id), summary]);
  }

  /** Liefert false, wenn es keinen Import mit dieser ID gab. */
  public remove(id: string): boolean {
    const summaries = this.list();
    const remaining = summaries.filter((summary) => summary.id !== id);
    if (remaining.length === summaries.length) {
      return false;
    }
    this.write(remaining);
    return true;
  }

  private write(summaries: Array<AdminGameSummary>): void {
    mkdirSync(path.dirname(this.filename), {recursive: true});
    writeFileSync(this.filename, JSON.stringify(summaries, null, 2));
  }
}
