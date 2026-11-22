// Every replay step builds the whole game view anew (replayViewModel.ts). Handed to the game's components like that,
// all of them update and measure their layout again – board, player table, card lists – which made each step slow
// and the cards flicker. This keeps every part that did not change between two steps as the very same object, so
// Vue skips the components whose data stayed the same.

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

export function reuseUnchanged<T>(previous: unknown, next: T): T {
  if (previous === next) {
    return next;
  }
  if (Array.isArray(previous) && Array.isArray(next)) {
    const items = next.map((item, index) => reuseUnchanged(previous[index], item));
    const same = items.length === previous.length && items.every((item, index) => item === previous[index]);
    return (same ? previous : items) as T;
  }
  if (typeof previous === 'object' && previous !== null && typeof next === 'object' && next !== null &&
    Object.getPrototypeOf(previous) === Object.getPrototypeOf(next)) {
    const previousRecord = previous as Record<string, unknown>;
    const nextRecord = next as Record<string, unknown>;
    const keys = Object.keys(nextRecord);
    const merged: Record<string, unknown> = {};
    let same = keys.length === Object.keys(previousRecord).length;
    for (const key of keys) {
      merged[key] = reuseUnchanged(previousRecord[key], nextRecord[key]);
      same = same && merged[key] === previousRecord[key];
    }
    if (same) {
      return previous as T;
    }
    // Instances of classes (e.g. LogMessage) keep their class: changed ones are taken as they are
    return (isPlainObject(next) ? merged : next) as T;
  }
  return next;
}
