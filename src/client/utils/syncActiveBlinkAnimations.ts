// All "taking their turn" blink animations in sync (frame around the window, "active" status in the player bars;
// keyframes in active_player_outline.less). CSS animations start as soon as their element is created – newly
// rendered elements would otherwise run offset. Shared start time 0 of the document timeline = same phase.
export const ACTIVE_BLINK_ANIMATION_PREFIX = 'active-player-';

export function syncActiveBlinkAnimations(): void {
  // jsdom (client tests) and old browsers don't know the Web Animations API
  if (typeof document.getAnimations !== 'function' || typeof CSSAnimation === 'undefined') {
    return;
  }
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSAnimation && animation.animationName.startsWith(ACTIVE_BLINK_ANIMATION_PREFIX) && animation.startTime !== 0) {
      animation.startTime = 0;
    }
  }
}
