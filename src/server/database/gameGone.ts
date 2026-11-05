import {GameId} from '../../common/Types';

type GameGoneListener = (gameId: GameId) => void;

const listeners: Array<GameGoneListener> = [];

/**
 * Lets whoever is bound to a game (e.g. the lobby with its "running" list) learn when it ends or is
 * deleted. A loose hook instead of an import in GameLoader on purpose: tests that finish games must
 * not touch the lobby file.
 */
export function onGameGone(listener: GameGoneListener): void {
  listeners.push(listener);
}

/** Called by GameLoader when a game finished, was deleted in the admin area or purged */
export function notifyGameGone(gameId: GameId): void {
  for (const listener of listeners) {
    try {
      listener(gameId);
    } catch (err) {
      // A failing listener must not stop the game from finishing or being deleted
      console.error(err);
    }
  }
}
