import * as fs from 'fs';
import * as path from 'path';
import {LobbyGameCourse, LobbySetupModel} from '../../common/lobby/LobbyModel';
import {AiLevel} from '../../common/ai/AiLevel';
import {GameId, SpectatorId} from '../../common/Types';

// The finished AI training games the lobby offers to watch, kept in a file in the db folder next to the games
// themselves, so they survive a restart. Scripts that collect games for analysis can skip these ids.

export type StoredAiTrainingGame = {
  /** Batch and game in the batch: the same game is imported only once */
  key: string;
  number: number;
  title: string;
  gameId: GameId;
  spectatorId: SpectatorId;
  finishedAt: number;
  playerCount: number;
  level: AiLevel;
  generation: number;
  elapsedMs: number;
  setup: LobbySetupModel;
  /** Course for the lobby's bar (games imported before it: computed once from the stored game) */
  course?: LobbyGameCourse;
};

export function aiTrainingFile(): string {
  return process.env.AI_TRAINING_FILE ?? path.resolve('db', 'ai-training-games.json');
}

export type AiTrainingStorage = {
  load(): Array<StoredAiTrainingGame>;
  save(games: ReadonlyArray<StoredAiTrainingGame>): void;
};

export function fileTrainingStorage(file: string = aiTrainingFile()): AiTrainingStorage {
  return {
    load() {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        return Array.isArray(data) ? data : [];
      } catch {
        // No file yet: nothing imported so far
        return [];
      }
    },
    save(games) {
      try {
        fs.mkdirSync(path.dirname(file), {recursive: true});
        const temporary = file + '.tmp';
        fs.writeFileSync(temporary, JSON.stringify(games, null, 2));
        fs.renameSync(temporary, file);
      } catch (error) {
        console.error('Could not save the AI training games', error);
      }
    },
  };
}

/** Tests: nothing on disk */
export function memoryTrainingStorage(initial: Array<StoredAiTrainingGame> = []): AiTrainingStorage & {games: Array<StoredAiTrainingGame>} {
  const storage = {
    games: initial,
    load: () => storage.games.map((game) => ({...game})),
    save: (games: ReadonlyArray<StoredAiTrainingGame>) => {
      storage.games = games.map((game) => ({...game}));
    },
  };
  return storage;
}
