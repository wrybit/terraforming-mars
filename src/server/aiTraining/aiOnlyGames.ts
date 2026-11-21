import {GameId} from '../../common/Types';
import {Phase} from '../../common/Phase';
import {IGameLoader} from '../database/IGameLoader';
import {AiTrainingStorage, fileTrainingStorage} from './aiTrainingStore';

// Games without a single human say nothing about this server's players: AI test and training games belong to
// the AI training (runner computers, Oracle export), not into the admin lists, the dashboard or the statistics.
// The game server therefore never keeps them for long. The only exception are the last finished AI training
// games the lobby offers to watch (aiTrainingStore.ts); they are rotated out there.

/** Finished AI-only games stay this long, so the end page can still be looked at and the Oracle export (every 15 min) gets them */
export const AI_ONLY_GAME_KEEP_MS = 2 * 60 * 60 * 1000;

type GameWithPlayers = {players: ReadonlyArray<{aiLevel: unknown}>};

/** True when every seat is an AI player */
export function isAiOnlyGame(game: GameWithPlayers): boolean {
  return game.players.length > 0 && game.players.every((player) => player.aiLevel !== undefined);
}

// Games with a human never become AI-only: once checked they are not loaded again by later runs
const gamesWithHumans = new Set<GameId>();

/**
 * Deletes the finished AI-only games older than AI_ONLY_GAME_KEEP_MS, except the ones the lobby keeps to watch.
 * Running games stay (an AI game started from the lobby is still being watched). Returns the deleted ids.
 */
export async function removeAiOnlyGames(gameLoader: IGameLoader, storage: AiTrainingStorage = fileTrainingStorage(), nowMs: number = Date.now()): Promise<Array<GameId>> {
  const lobbyGames = new Set(storage.load().map((game) => game.gameId));
  const removed: Array<GameId> = [];
  for (const {gameId} of await gameLoader.getIds()) {
    if (lobbyGames.has(gameId) || gamesWithHumans.has(gameId)) {
      continue;
    }
    const game = await gameLoader.getGame(gameId).catch(() => undefined);
    if (game === undefined) {
      continue;
    }
    if (!isAiOnlyGame(game)) {
      gamesWithHumans.add(gameId);
      continue;
    }
    if (game.phase !== Phase.END || nowMs - game.lastActivityTime.getTime() < AI_ONLY_GAME_KEEP_MS) {
      continue;
    }
    try {
      await gameLoader.deleteGame(gameId, 'removed-ai-only');
      removed.push(gameId);
    } catch (error) {
      console.error(`Could not remove AI-only game ${gameId}`, error);
    }
  }
  return removed;
}

/** Tests: forget which games were already checked */
export function resetAiOnlyGameChecks(): void {
  gamesWithHumans.clear();
}
