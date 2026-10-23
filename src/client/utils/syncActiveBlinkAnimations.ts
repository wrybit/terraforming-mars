// All "taking their turn" blink animations in sync (frame around the window, "active" status in the player bars;
// keyframes in active_player_outline.less). CSS animations start as soon as their element is created – newly
// rendered elements would otherwise run offset. Shared start time 0 of the document timeline = same phase.
export const ACTIVE_BLINK_ANIMATION_PREFIX = 'active-player-';

let scheduled = false;

/**
 * Every player status calls this when it renders: done once in the next frame for all of them, since each call goes
 * through all animations of the page (about a tenth of a game update with two players, Jens 23 Oct 2026)
 */
export function syncActiveBlinkAnimations(): void {
  if (scheduled) {
    return;
  }
  if (typeof requestAnimationFrame === 'undefined') {
    syncNow();
    return;
  }
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    syncNow();
  });
}

function syncNow(): void {
  // jsdom (client tests) and old browsers don't know the Web Animations API
  if (typeof document.getAnimations !== 'function' || typeof CSSAnimation === 'undefined') {
    return;
  }
  for (const animation of document.getAnimations()) {
    // A paused one stays paused (setting the start time would run it again): idle pause, ambientMotion.ts
    if (animation instanceof CSSAnimation && animation.animationName.startsWith(ACTIVE_BLINK_ANIMATION_PREFIX) && animation.startTime !== 0 &&
      animation.playState !== 'paused') {
      animation.startTime = 0;
    }
  }
}
