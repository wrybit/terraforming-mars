import {ReplayTrackEntry, ReplayTrackState} from '../../common/replay/ReplayTrack';
import {Color} from '../../common/Color';

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Only keys whose value changed; undefined when nothing did
function changedKeys<T extends object>(before: T, after: T): Partial<T> | undefined {
  const changes: Partial<T> = {};
  let changed = false;
  for (const key of Object.keys(after) as Array<keyof T>) {
    if (!same(before[key], after[key])) {
      changes[key] = after[key];
      changed = true;
    }
  }
  return changed ? changes : undefined;
}

/** What changed from `before` to `after` as an entry at log length `line`; undefined when nothing changed */
export function replayTrackDifference(before: ReplayTrackState, after: ReplayTrackState, line: number): ReplayTrackEntry | undefined {
  const entry: ReplayTrackEntry = {line};
  const game = changedKeys(before.game, after.game);
  if (game !== undefined) {
    entry.game = game;
  }
  const spaces = Object.values(after.spaces).filter((space) => space !== undefined && !same(before.spaces[space.id], space));
  if (spaces.length > 0) {
    entry.spaces = spaces.flatMap((space) => space === undefined ? [] : [space]);
  }
  for (const [color, player] of Object.entries(after.players) as Array<[Color, NonNullable<ReplayTrackState['players'][Color]>]>) {
    const changes = changedKeys(before.players[color] ?? {}, player);
    if (changes !== undefined) {
      entry.players = {...entry.players, [color]: changes};
    }
  }
  return entry.game === undefined && entry.spaces === undefined && entry.players === undefined ? undefined : entry;
}
