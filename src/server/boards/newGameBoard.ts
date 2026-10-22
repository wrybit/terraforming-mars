import {BoardName} from '../../common/boards/BoardName';
import {boardPool} from '../../common/boards/boardPool';
import {Random, SeededRandom} from '../../common/utils/Random';

// The board of a new game is drawn from its own seed (boardSeed), separate from the game seed.
// The "Create game" page sends this seed both to the board preview and with the game, so the preview
// shows exactly the board the game gets – while decks and everything else stay unpredictable.

/** Random source of the board; an invalid or missing seed (older clients) falls back to a random one. */
export function boardRandom(boardSeed: unknown): SeededRandom {
  const valid = typeof boardSeed === 'number' && Number.isFinite(boardSeed) && boardSeed >= 0 && boardSeed < 1;
  return new SeededRandom(valid ? boardSeed : Math.random());
}

/**
 * Draws the board from the request's pool (`boards`, or the older single `board`).
 * Always takes one value from `rng`, even for a fixed board,
 * so the following shuffle of the bonuses does not depend on whether the board was random.
 */
export function pickBoard(request: {boards?: unknown, board?: unknown}, rng: Random): BoardName {
  const candidates = boardPool(request.boards, request.board);
  return candidates[rng.nextInt(candidates.length)];
}
