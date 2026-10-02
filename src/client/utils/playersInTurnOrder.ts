import {Color} from '@/common/Color';

// Opponents in turn order starting with the player after yourself, yourself last – the same order
// in the player list (PlayersOverview) and the milestone table. Unchanged without an own player (spectators).
export function playersInTurnOrder<T extends {color: Color}>(players: ReadonlyArray<T>, ownColor: Color | undefined): Array<T> {
  const ownIndex = players.findIndex((player) => player.color === ownColor);
  if (ownIndex === -1) {
    return [...players];
  }
  return [...players.slice(ownIndex + 1), ...players.slice(0, ownIndex + 1)];
}
