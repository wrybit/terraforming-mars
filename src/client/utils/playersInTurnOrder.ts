import {Color} from '@/common/Color';

// Mitspieler in Zugreihenfolge ab dem Spieler nach einem selbst, man selbst zuletzt – dieselbe Reihenfolge
// in der Spielerliste (PlayersOverview) und der Meilenstein-Tabelle. Ohne eigenen Spieler (Zuschauer) unverändert.
export function playersInTurnOrder<T extends {color: Color}>(players: ReadonlyArray<T>, ownColor: Color | undefined): Array<T> {
  const ownIndex = players.findIndex((player) => player.color === ownColor);
  if (ownIndex === -1) {
    return [...players];
  }
  return [...players.slice(ownIndex + 1), ...players.slice(0, ownIndex + 1)];
}
