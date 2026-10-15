import {IGame} from './IGame';
import {IPlayer} from './IPlayer';
import {Phase} from '../common/Phase';
import {PlayerId} from '../common/Types';
import {SerializedGame} from './SerializedGame';
import {SerializedPlayer} from './SerializedPlayer';
import {isSimulating} from './ai/simulationSandbox';

/*
 * Cancel an action that is still only a plan (e.g. city placement after paying for the standard project):
 * at the start of every action the game state is kept in memory; as long as the action revealed no hidden
 * information (cards drawn, random draws) and did not touch other players, the player may return to it.
 * Payment is returned with it – it is public information.
 */
type ActionStart = {
  playerId: PlayerId,
  snapshot: string,
  // inputsThisRound once the action menu is shown: more inputs mean the action has started
  inputs: number,
};

// In memory only (not serialized): after a server restart an action can no longer be cancelled
const actionStarts = new WeakMap<IGame, ActionStart>();

/* Called right before the player gets the action menu (Player.takeAction). */
export function rememberActionStart(player: IPlayer): void {
  const game = player.game;
  // AI copies are never cancelled by a human; serializing them here cost most of a rollout's time
  if (game.phase !== Phase.ACTION || isSimulating()) {
    actionStarts.delete(game);
    return;
  }
  actionStarts.set(game, {
    playerId: player.id,
    snapshot: JSON.stringify(game.serialize()),
    inputs: game.inputsThisRound + 1,
  });
}

// Other players without their timers (their clocks do not run, but the field may be rewritten)
function otherPlayers(game: SerializedGame, playerId: PlayerId): string {
  return JSON.stringify(game.players
    .filter((player) => player.id !== playerId)
    .map((player) => ({...player, timer: undefined} as Partial<SerializedPlayer>)));
}

// Everything hidden from the players that a roll back would let them see again: decks, random seed, tokens
function hiddenInformation(game: SerializedGame): Array<unknown> {
  return [
    game.projectDeck, game.corporationDeck, game.preludeDeck, game.ceoDeck,
    game.currentSeed,
    game.underworldData?.tokens,
    game.turmoil?.globalEventDealer,
  ];
}

// Everything that would show hidden information or affect someone else when rolled back
function hiddenOrShared(game: SerializedGame, playerId: PlayerId): string {
  return JSON.stringify([...hiddenInformation(game), otherPlayers(game, playerId)]);
}

/**
 * Whether going back to an earlier save would let the player see hidden information again (cards drawn
 * in between, random draws). Undo must not allow it: after rolling back, the player would know the next
 * cards of the deck and could choose differently.
 */
export function revealsHiddenInformation(earlier: SerializedGame, current: SerializedGame): boolean {
  return JSON.stringify(hiddenInformation(earlier)) !== JSON.stringify(hiddenInformation(current));
}

/* State to return to, if the player's current action can still be cancelled. */
export function cancellableActionStart(player: IPlayer): SerializedGame | undefined {
  const game = player.game;
  const start = actionStarts.get(game);
  if (start === undefined || start.playerId !== player.id || game.activePlayer.id !== player.id || game.phase !== Phase.ACTION) {
    return undefined;
  }
  // Still in the action menu: nothing to cancel
  if (game.inputsThisRound <= start.inputs || player.getWaitingFor() === undefined) {
    return undefined;
  }
  const before = JSON.parse(start.snapshot) as SerializedGame;
  if (hiddenOrShared(before, player.id) !== hiddenOrShared(game.serialize(), player.id)) {
    return undefined;
  }
  return before;
}

export function canCancelAction(player: IPlayer): boolean {
  return cancellableActionStart(player) !== undefined;
}
