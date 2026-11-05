import * as fs from 'fs';
import * as path from 'path';

// The lobby's rooms survive a server restart (update, crash): after every change they are written to a
// file in the db folder, which outlives the container like the games; on start they are read back.

export function lobbyFile(): string {
  return process.env.LOBBY_FILE ?? path.resolve('db', 'lobby.json');
}

export type LobbyStorage = {
  load(): unknown;
  save(data: unknown): void;
};

/** Reads and writes one JSON file; written to a temporary file first, so a crash never leaves half a file */
export function fileStorage(file: string = lobbyFile()): LobbyStorage {
  return {
    load(): unknown {
      try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {
        // No file yet (first start) or unreadable: start with an empty lobby
        return undefined;
      }
    },
    save(data: unknown): void {
      try {
        fs.mkdirSync(path.dirname(file), {recursive: true});
        const temporary = file + '.tmp';
        fs.writeFileSync(temporary, JSON.stringify(data));
        fs.renameSync(temporary, file);
      } catch (error) {
        // The lobby keeps working in memory; only the next restart would lose it
        console.error('Could not save the lobby', error);
      }
    },
  };
}

/** Tests: nothing on disk */
export function memoryStorage(initial?: unknown): LobbyStorage & {data: unknown} {
  const storage = {
    data: initial,
    load: () => storage.data,
    save: (data: unknown) => {
      storage.data = JSON.parse(JSON.stringify(data));
    },
  };
  return storage;
}
