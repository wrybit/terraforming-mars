import {SegmentOption} from '@/client/components/create/createGameChoices';

// Minimum number of games for long lists: otherwise lots of once-played entries with 100 % would be on top
export const MIN_PLAYS_OPTIONS: ReadonlyArray<SegmentOption> = [1, 2, 3, 5].map((value) => ({value, label: `${value}×`}));
const DEFAULT_MIN_PLAYS = 3;
// Only so strict that enough entries remain (preludes, e.g., only come from a few games)
const MIN_VISIBLE_ROWS = 10;

/** Highest minimum (up to 3×) at which MIN_VISIBLE_ROWS entries still remain visible. */
export function chooseMinPlays(plays: ReadonlyArray<number>): number {
  return [DEFAULT_MIN_PLAYS, 2, 1].find((minimum) => plays.filter((count) => count >= minimum).length >= MIN_VISIBLE_ROWS) ?? 1;
}
