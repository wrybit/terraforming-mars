import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {PlayerInput} from '../PlayerInput';
import {InputResponse} from '../../common/inputs/InputResponse';

// Player.setWaitingFor reports AI players here. The indirection keeps Player free of any
// import of the AI code (which itself imports half the server) and avoids import cycles.
let onAiPlayerWaiting: (player: IPlayer) => void = () => {};
// Games with Rust AI players follow every answered input and every loaded game object (ai/rust/RustMirror.ts)
let onInputProcessed: (player: IPlayer, input: PlayerInput, response: InputResponse, saveId: number) => void = () => {};
let onGameLoaded: (game: IGame) => void = () => {};

export function registerAiHook(handler: (player: IPlayer) => void): void {
  onAiPlayerWaiting = handler;
}

export function registerProcessedHook(handler: typeof onInputProcessed): void {
  onInputProcessed = handler;
}

export function registerGameLoadedHook(handler: (game: IGame) => void): void {
  onGameLoaded = handler;
}

export function notifyAiPlayerWaiting(player: IPlayer): void {
  onAiPlayerWaiting(player);
}

export function notifyInputProcessed(player: IPlayer, input: PlayerInput, response: InputResponse, saveId: number): void {
  onInputProcessed(player, input, response, saveId);
}

export function notifyGameLoaded(game: IGame): void {
  onGameLoaded(game);
}
