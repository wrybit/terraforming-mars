// Cleanup functions (observers, registrations) kept per component instance instead of one module variable.
// When a view is built anew (App.vue gameViewKey: DevTools switch board or theme), the new instance mounts before the
// old one unmounts; with one shared variable the old instance's unmount stopped the new instance's observer.
const cleanups = new WeakMap<object, Map<string, () => void>>();

/** Runs the cleanup kept under `key` for `owner`, then keeps `next` in its place (none: just runs the old one) */
export function replaceCleanup(owner: object, key: string, next?: () => void): void {
  let entries = cleanups.get(owner);
  entries?.get(key)?.();
  entries?.delete(key);
  if (next !== undefined) {
    if (entries === undefined) {
      entries = new Map();
      cleanups.set(owner, entries);
    }
    entries.set(key, next);
  }
}
