import {BoardName} from './BoardName';
import {RandomBoardOption} from './RandomBoardOption';
import {boardOptions} from './randomBoardOptions';

// The board setting is a pool of boards: one board is a fixed board, several are drawn from at random.
// Older settings files, share links and API clients still send a single `board` (also a random option).

const RANDOM_OPTIONS: ReadonlyArray<RandomBoardOption> = [RandomBoardOption.OFFICIAL, RandomBoardOption.ALL];

function isBoardName(value: unknown): value is BoardName {
  return (Object.values(BoardName) as Array<unknown>).includes(value);
}

function isRandomOption(value: unknown): value is RandomBoardOption {
  return (RANDOM_OPTIONS as ReadonlyArray<unknown>).includes(value);
}

/** True when both pools hold the same boards, in any order. */
export function sameBoards(a: ReadonlyArray<BoardName>, b: ReadonlyArray<BoardName>): boolean {
  const set = new Set(a);
  return set.size === new Set(b).size && b.every((board) => set.has(board));
}

/** The random option whose pool is exactly `boards`, if there is one. */
export function randomOptionOf(boards: ReadonlyArray<BoardName>): RandomBoardOption | undefined {
  return RANDOM_OPTIONS.find((option) => sameBoards(boards, boardOptions(option)));
}

/** One value for formats that carry a single board: the board itself, the matching random option, or "random all" for any other pool. */
export function singleBoardValue(boards: ReadonlyArray<BoardName>): BoardName | RandomBoardOption {
  if (boards.length === 1) {
    return boards[0];
  }
  return randomOptionOf(boards) ?? RandomBoardOption.ALL;
}

/**
 * The board pool of a request or settings file: `boards`, or else the older single `board`.
 * Unknown names and duplicates are dropped; with nothing valid left it is Tharsis.
 */
export function boardPool(boards: unknown, board?: unknown): Array<BoardName> {
  let pool: Array<BoardName> = [];
  if (Array.isArray(boards)) {
    pool = [...new Set(boards.filter(isBoardName))];
  } else if (isRandomOption(board)) {
    pool = boardOptions(board);
  } else if (isBoardName(board)) {
    pool = [board];
  }
  return pool.length > 0 ? pool : [BoardName.THARSIS];
}
