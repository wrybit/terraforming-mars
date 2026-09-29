import {PlayerInputModel} from '@/common/models/PlayerInputModel';

// Anzahl auswählbarer Einträge einer Eingabe (Karten, Standardprojekte, Unteroptionen) für das Tab-Badge.
// undefined, wenn die Eingabe keine Liste hat (z. B. eine einfache Bestätigung).
export function inputAvailableCount(input: PlayerInputModel): number | undefined {
  if (input.type === 'projectCard' || input.type === 'card') {
    return input.cards.filter((card) => card.isDisabled !== true).length;
  }
  if (input.type === 'or') {
    // Eine Spielerwahl zählt mit jedem wählbaren Spieler, wie sie als Kacheln erscheint (OrOptions)
    return input.options.reduce((sum, option) => sum + (option.type === 'player' ? option.players.length : 1), 0);
  }
  return undefined;
}
