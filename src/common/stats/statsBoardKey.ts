import {BoardName} from '../boards/BoardName';
import {StatsGameDetails} from './StatsGame';

// Contract between stats API and stats page: under which board name a game counts in the statistics.

/** All games with shuffled board tiles count as one board – their spaces carry different bonuses in every game. */
export const RANDOM_BOARD = 'random';

export type StatsBoardKey = BoardName | typeof RANDOM_BOARD;

export function statsBoardKey(details: StatsGameDetails | undefined): StatsBoardKey | undefined {
  if (details?.boardName === undefined) {
    return undefined;
  }
  // A shuffled Tharsis is a different game than a normal Tharsis: mixing both would distort the board's numbers
  return details.shuffledBoard === true ? RANDOM_BOARD : details.boardName;
}
