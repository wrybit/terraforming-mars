// Läuft gerade eine Feldwahl (Plättchen, Kolonie-Feld, Mond …)? Dann darf ein Klick aufs Brett
// nicht das Vergrößerungs-Modal öffnen, sonst lässt sich nichts mehr platzieren.
// Signal ist die gemountete Feldwahl selbst (SelectSpace.vue), nicht die markierten Felder:
// Nach dem Antippen eines Feldes nimmt SelectSpace alle Markierungen weg, bevor der Klick das Brett erreicht.
// Dieselben Selektoren stehen in board_zoom_modal.less (Lupen-Cursor).
export const SELECT_SPACE_SELECTOR = '.select_space_cont';
export const AVAILABLE_SPACE_SELECTOR = '.board-space--available';

export function isBoardPlacementActive(root: Document | HTMLElement = document): boolean {
  return root.querySelector(SELECT_SPACE_SELECTOR) !== null || root.querySelector(AVAILABLE_SPACE_SELECTOR) !== null;
}
