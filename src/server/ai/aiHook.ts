import {IPlayer} from '../IPlayer';

// Player.setWaitingFor reports AI players here. The indirection keeps Player free of any
// import of the AI code (which itself imports half the server) and avoids import cycles.
let onAiPlayerWaiting: (player: IPlayer) => void = () => {};

export function registerAiHook(handler: (player: IPlayer) => void): void {
  onAiPlayerWaiting = handler;
}

export function notifyAiPlayerWaiting(player: IPlayer): void {
  onAiPlayerWaiting(player);
}
