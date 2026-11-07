import {GameId} from '../../common/Types';
import {AiTrainingStorage, fileTrainingStorage} from './aiTrainingStore';

// The imported AI training games are there to be watched from the lobby only. Everywhere else – the game list
// API, the admin game list, the dashboard counts and the statistics – they are no games of this server's players.

/** The entries without the AI training games the lobby imported (aiTrainingStore.ts) */
export function withoutAiTrainingGames<T extends {gameId: GameId}>(entries: ReadonlyArray<T>, storage: AiTrainingStorage = fileTrainingStorage()): Array<T> {
  const trainingGameIds = new Set(storage.load().map((game) => game.gameId));
  return entries.filter((entry) => !trainingGameIds.has(entry.gameId));
}
