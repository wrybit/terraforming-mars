import {disableAutoUnmount, enableAutoUnmount} from '@vue/test-utils';

// The suite runs with `isolate: false`, so the jsdom environment outlives each
// spec file. Unmounting every wrapper stops one spec's teardown from leaking
// timers, listeners or detached nodes into the next.
//
// This file re-runs per spec file, but test-utils keeps `isEnabled` in module
// state that the shared environment preserves, so enabling twice throws without
// the reset.
disableAutoUnmount();
enableAutoUnmount(afterEach);

// Node 25 ships its own global localStorage. Without --localstorage-file it lacks getItem, and it
// shadows the one from jsdom – then all specs that read settings fail. In that case use a
// simple in-memory store that behaves like Web Storage.
if (typeof global.localStorage?.getItem !== 'function') {
  const values = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, String(value));
    },
  };
  Object.defineProperty(global, 'localStorage', {value: memoryStorage, configurable: true, writable: true});
}
