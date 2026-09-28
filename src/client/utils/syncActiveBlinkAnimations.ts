// Alle "am Zug"-Blinkanimationen im Gleichtakt (Rahmen ums Fenster, Status "aktiv" in den Spielerleisten;
// Keyframes in active_player_outline.less). CSS-Animationen starten, sobald ihr Element entsteht – neu
// gerenderte Elemente liefen sonst versetzt. Gemeinsamer Startzeitpunkt 0 der Dokument-Zeitleiste = gleiche Phase.
export const ACTIVE_BLINK_ANIMATION_PREFIX = 'active-player-';

export function syncActiveBlinkAnimations(): void {
  // jsdom (Client-Tests) und alte Browser kennen die Web-Animations-API nicht
  if (typeof document.getAnimations !== 'function' || typeof CSSAnimation === 'undefined') {
    return;
  }
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSAnimation && animation.animationName.startsWith(ACTIVE_BLINK_ANIMATION_PREFIX) && animation.startTime !== 0) {
      animation.startTime = 0;
    }
  }
}
