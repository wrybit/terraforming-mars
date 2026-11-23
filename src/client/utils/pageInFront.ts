/**
 * Ob der Spieler die Seite gerade vor Augen hat: Tab sichtbar UND Fenster im Fokus.
 * Dann ist eine System-Benachrichtigung überflüssig und störend – sie soll nur kommen,
 * wenn der Tab verdeckt ist oder ein anderes Fenster/Programm vorne liegt.
 */
export function isPageInFront(): boolean {
  return document.visibilityState === 'visible' && document.hasFocus();
}
