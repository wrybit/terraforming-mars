import {Game} from '../Game';
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {runInSandbox} from './simulationSandbox';
import {quickResponse} from './quickResponse';
import {randomResponse} from './randomResponse';

// Copies of a running game for trying out moves. A copy is rebuilt from the game's serialized
// form, so it starts at the beginning of the current player's turn (the same point where the
// AI decides on its action).

export type GameSnapshot = string;

export function snapshotOf(game: IGame): GameSnapshot {
  return JSON.stringify(game.serialize());
}

/** Must be called inside runInSandbox. */
export function restoreCopy(snapshot: GameSnapshot): IGame {
  return Game.deserialize(JSON.parse(snapshot));
}

export function withCopy<T>(snapshot: GameSnapshot, work: (copy: IGame) => T): T {
  return runInSandbox(() => work(restoreCopy(snapshot)));
}

const ACTION_MENU_TITLES = new Set(['Take your first action', 'Take your next action']);

/** The top-level "what do you do now" menu of the action phase. */
export function isActionMenu(input: PlayerInput | undefined): input is OrOptions {
  return input instanceof OrOptions && typeof input.title === 'string' && ACTION_MENU_TITLES.has(input.title);
}

const MAXIMUM_FOLLOW_UPS = 30;

/**
 * Answers the player's follow-up questions inside a copy with quick rules until the move is
 * complete: the player is back at the action menu, waits for nothing, or the phase changed.
 */
export function finishMove(copy: IGame, player: IPlayer): void {
  const phase = copy.phase;
  const generation = copy.generation;
  for (let step = 0; step < MAXIMUM_FOLLOW_UPS; step++) {
    const waitingFor = player.getWaitingFor();
    if (waitingFor === undefined || isActionMenu(waitingFor) || copy.phase !== phase || copy.generation !== generation) {
      return;
    }
    try {
      player.process(quickResponse(waitingFor, player));
    } catch {
      try {
        player.process(randomResponse(waitingFor, player, Math.random));
      } catch {
        return;
      }
    }
  }
}
