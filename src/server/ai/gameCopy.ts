import {Game} from '../Game';
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {runInSandbox} from './simulationSandbox';
import {quickResponse} from './quickResponse';
import {randomResponse} from './randomResponse';
import {tuningOf} from './aiTuning';

// Copies of a running game for trying out moves. A copy is rebuilt from the game's serialized
// form, so it starts at the beginning of the current player's turn (the same point where the
// AI decides on its action).

export type GameSnapshot = string;

/**
 * Copy of the game as `viewer` may know it: the opponents' hidden cards (hand, drafted cards,
 * dealt cards) are swapped for random unseen cards and the draw pile is shuffled. Without this
 * the AI "peeked": an opponent reply was tried with the real hand, and a card draw in a copy
 * revealed the real next cards. Without `viewer` the copy is exact (copies of copies).
 */
export function snapshotOf(game: IGame, viewer?: IPlayer): GameSnapshot {
  const exact = JSON.stringify(game.serialize());
  if (viewer === undefined) {
    return exact;
  }
  return withCopy(exact, (copy) => {
    hideUnknownCards(copy, viewer.id);
    return JSON.stringify(copy.serialize());
  });
}

/** The game as the deciding player may know it (see snapshotOf). */
export function playerView(player: IPlayer): GameSnapshot {
  return snapshotOf(player.game, tuningOf(player).peek > 0 ? undefined : player);
}

function shuffleInPlace<T>(items: Array<T>, random: () => number): void {
  for (let index = items.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
}

const HIDDEN_CARD_LISTS = ['cardsInHand', 'draftedCards', 'draftHand', 'dealtProjectCards'] as const;

/** Must be called on a copy (inside runInSandbox): swaps the hidden cards of everyone but the viewer. */
export function hideUnknownCards(copy: IGame, viewerId: string, random: () => number = Math.random): void {
  const opponents = copy.players.filter((other) => other.id !== viewerId);
  const drawPile = copy.projectDeck.drawPile;
  const unseen = [...drawPile];
  for (const opponent of opponents) {
    for (const list of HIDDEN_CARD_LISTS) {
      unseen.push(...opponent[list]);
    }
  }
  shuffleInPlace(unseen, random);
  for (const opponent of opponents) {
    for (const list of HIDDEN_CARD_LISTS) {
      const count = opponent[list].length;
      opponent[list].splice(0, count, ...unseen.splice(0, count));
    }
  }
  drawPile.splice(0, drawPile.length, ...unseen);
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
