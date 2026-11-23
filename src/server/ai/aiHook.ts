import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {PlayerInput} from '../PlayerInput';
import {InputResponse} from '../../common/inputs/InputResponse';

// Player.setWaitingFor reports AI players here. The indirection keeps Player free of any
// import of the AI code (which itself imports half the server) and avoids import cycles.
let onAiPlayerWaiting: (player: IPlayer) => void = () => {};
// Games with Rust AI players follow every answered input and every loaded game object (ai/rust/RustMirror.ts)
let onInputProcessed: (player: IPlayer, input: PlayerInput, response: InputResponse, saveId: number) => void = () => {};
let onGameLoaded: (game: IGame, loadedSaveId: number) => void = () => {};

export function registerAiHook(handler: (player: IPlayer) => void): void {
  onAiPlayerWaiting = handler;
}

export function registerProcessedHook(handler: typeof onInputProcessed): void {
  onInputProcessed = handler;
}

export function registerGameLoadedHook(handler: (game: IGame, loadedSaveId: number) => void): void {
  onGameLoaded = handler;
}

export function notifyAiPlayerWaiting(player: IPlayer): void {
  onAiPlayerWaiting(player);
}

export function notifyInputProcessed(player: IPlayer, input: PlayerInput, response: InputResponse, saveId: number): void {
  onInputProcessed(player, input, response, saveId);
}

/** `loadedSaveId`: the save the game was loaded from (loading itself may save again before this call) */
export function notifyGameLoaded(game: IGame, loadedSaveId: number): void {
  onGameLoaded(game, loadedSaveId);
}
