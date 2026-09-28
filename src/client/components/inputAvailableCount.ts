import {PlayerInputModel} from '@/common/models/PlayerInputModel';

// Anzahl auswählbarer Einträge einer Eingabe (Karten, Standardprojekte, Unteroptionen) für das Tab-Badge.
// undefined, wenn die Eingabe keine Liste hat (z. B. eine einfache Bestätigung).
export function inputAvailableCount(input: PlayerInputModel): number | undefined {
  if (input.type === 'projectCard' || input.type === 'card') {
    return input.cards.filter((card) => card.isDisabled !== true).length;
  }
  if (input.type === 'or') {
    return input.options.length;
  }
  return undefined;
}
