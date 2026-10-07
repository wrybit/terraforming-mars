import {Database} from '../database/Database';
import {GameLoader} from '../database/GameLoader';

// While the AI tries out moves on copies of a game, nothing may reach the real database or the
// game cache: the copies share the real game's id and would overwrite it. The AI also must not
// schedule moves for the AI players inside those copies.

let simulationDepth = 0;

/** Returns an object whose every method is a no-op returning a resolved promise. */
function inertStub<T extends object>(): T {
  return new Proxy({}, {get: () => () => Promise.resolve(undefined)}) as T;
}

export function isSimulating(): boolean {
  return simulationDepth > 0;
}

/** Runs `work` synchronously with database and game cache replaced by no-op stubs. */
export function runInSandbox<T>(work: () => T): T {
  const originalDatabase = Database.getInstance;
  const originalGameLoader = GameLoader.getInstance;
  const database = inertStub<ReturnType<typeof Database.getInstance>>();
  const gameLoader = inertStub<ReturnType<typeof GameLoader.getInstance>>();
  // Tried-out moves may break rules on purpose (cards valued without their requirements);
  // the engine's "illegal state" warnings about such copies would only flood the server log.
  const originalWarn = console.warn;
  Database.getInstance = () => database;
  GameLoader.getInstance = () => gameLoader;
  console.warn = () => {};
  simulationDepth++;
  try {
    return work();
  } finally {
    simulationDepth--;
    Database.getInstance = originalDatabase;
    GameLoader.getInstance = originalGameLoader;
    console.warn = originalWarn;
  }
}
