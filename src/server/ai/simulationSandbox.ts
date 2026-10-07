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
  Database.getInstance = () => database;
  GameLoader.getInstance = () => gameLoader;
  simulationDepth++;
  try {
    return work();
  } finally {
    simulationDepth--;
    Database.getInstance = originalDatabase;
    GameLoader.getInstance = originalGameLoader;
  }
}
