import * as fs from 'fs';
import * as path from 'path';
import {GameDeletionModel, GameDeletionReason} from '../../common/models/GameDeletionModel';

// Eine geloeschte Partie hinterliess bisher keine Spur: Links darauf endeten in "nicht gefunden" ohne
// Erklaerung. Diese Datei merkt sich je geloeschter Partie alle IDs (Spiel, Spieler, Zuschauer), Zeit und
// Grund. Eine Zeile JSON je Partie; liegt im db-Ordner, damit sie Container-Neustarts ueberlebt.
function logFile(): string {
  return process.env.DELETED_GAMES_FILE ?? path.resolve('db', 'deleted-games.jsonl');
}

export type DeletedGameEntry = {
  gameId: string,
  participantIds: Array<string>,
  playerNames: Array<string>,
  deletedAt: number,
  reason: GameDeletionReason,
  maxGameDays?: string,
};

export function recordDeletedGames(entries: ReadonlyArray<DeletedGameEntry>): void {
  if (entries.length === 0) {
    return;
  }
  try {
    fs.mkdirSync(path.dirname(logFile()), {recursive: true});
    fs.appendFileSync(logFile(), entries.map((entry) => JSON.stringify(entry) + '\n').join(''));
  } catch (err) {
    // Das Protokoll ist nur Erklaerhilfe: ein Schreibfehler darf das Loeschen nicht verhindern
    console.error('Could not record deleted games', err);
  }
}

/** Sucht nach Spiel-, Spieler- oder Zuschauer-ID. Neueste Eintraege zuerst, falls eine ID doppelt vorkommt. */
export function findDeletedGame(id: string): GameDeletionModel {
  let content: string;
  try {
    content = fs.readFileSync(logFile(), 'utf8');
  } catch {
    return {deleted: false};
  }
  const lines = content.split('\n').filter((line) => line.trim() !== '').reverse();
  for (const line of lines) {
    let entry: DeletedGameEntry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.gameId === id || entry.participantIds.includes(id)) {
      return {
        deleted: true,
        gameId: entry.gameId,
        deletedAt: entry.deletedAt,
        reason: entry.reason,
        playerNames: entry.playerNames ?? [],
        maxGameDays: entry.maxGameDays,
      };
    }
  }
  return {deleted: false};
}
