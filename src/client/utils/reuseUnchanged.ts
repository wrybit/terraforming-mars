// Polled lists (lobby rooms, chat) arrive as fresh objects every few seconds. Handing them to Vue as they are makes
// every row render again, although usually nothing changed. This keeps the previous object of every entry whose
// content is the same, and the previous list itself when nothing changed at all: Vue then renders only what changed.

export function reuseUnchanged<T>(previous: ReadonlyArray<T>, next: ReadonlyArray<T>, keyOf: (entry: T) => string): Array<T> {
  const before = new Map<string, {entry: T, json: string}>();
  for (const entry of previous) {
    before.set(keyOf(entry), {entry, json: JSON.stringify(entry)});
  }
  const merged = next.map((entry) => {
    const old = before.get(keyOf(entry));
    return old !== undefined && old.json === JSON.stringify(entry) ? old.entry : entry;
  });
  const same = merged.length === previous.length && merged.every((entry, index) => entry === previous[index]);
  return same ? previous as Array<T> : merged;
}
