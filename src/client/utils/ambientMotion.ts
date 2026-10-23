// Endless decorative animations (the blinking "your turn" markers, the Arrakis scales, the particles) run on one shared
// clock and stand still while nobody uses the page (Jens, 23 Oct 2026). Measured on the player page while idle: every
// running animation made the browser build all 120 frames per second, the GPU was busy 915 ms per second.
// - Shared clock: each iteration advances in steps of 1/30 s and all steps fall on the same grid of the document
//   timeline, so the page builds 30 frames per second instead of 120 (GPU −69 %). Smooth enough for slow blinking and
//   breathing; animations that react to the user (hover, tabs, moves) are not endless and keep the full frame rate.
// - Pause: after IDLE_PAUSE_MILLISECONDS without input, and while the page is hidden. The next input resumes them.
//   The turn markers stop fully visible, everything else where it is.

export const AMBIENT_FRAMES_PER_SECOND = 30;
export const IDLE_PAUSE_MILLISECONDS = 30_000;
// How often the idle time is checked
const IDLE_CHECK_MILLISECONDS = 2_000;
// Keyframes of the turn markers (active_player_outline.less): when pausing they show their first keyframe (fully visible)
const TURN_MARKER_PREFIX = 'active-player-';
// Input that counts as somebody using the page
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const;

const TICK_MILLISECONDS = 1000 / AMBIENT_FRAMES_PER_SECOND;
// The DOM timing type, named via the effect so eslint knows it
type AnimationTiming = ReturnType<AnimationEffect['getComputedTiming']>;

let lastActivity = 0;
let paused = false;
// Animations already put on the clock; the browser keeps an overridden timing for the life of the animation
const tuned = new WeakSet<Animation>();
// Paused here for idleness: only these resume (others are paused by their components, e.g. particles off screen)
const pausedHere = new Set<Animation>();

function supported(): boolean {
  // jsdom (client tests) and old browsers don't know the Web Animations API
  return typeof document !== 'undefined' && typeof document.getAnimations === 'function';
}

function isEndless(timing: AnimationTiming | undefined): boolean {
  return timing?.iterations === Infinity;
}

function isTurnMarker(animation: Animation): boolean {
  return typeof CSSAnimation !== 'undefined' && animation instanceof CSSAnimation && animation.animationName.startsWith(TURN_MARKER_PREFIX);
}

/**
 * Puts one endless animation on the shared clock: its iteration in whole steps of one tick, and the step boundaries
 * (start time + delay + n ticks) on the grid of the document timeline. `timing` is read beforehand: reading it brings
 * the styles up to date, writing outdates them, so many animations are read first and written after.
 */
export function alignToClock(animation: Animation, timing: AnimationTiming | undefined = animation.effect?.getComputedTiming(),
  retryWhenReady: boolean = true): void {
  const effect = animation.effect;
  if (effect === null || timing === undefined) {
    return;
  }
  const duration = Number(timing.duration);
  if (!Number.isFinite(duration) || duration <= 0) {
    return;
  }
  if (!tuned.has(animation)) {
    const steps = Math.max(1, Math.round(duration / TICK_MILLISECONDS));
    effect.updateTiming({duration: steps * TICK_MILLISECONDS, easing: `steps(${steps}, jump-start)`});
    tuned.add(animation);
  }
  const startTime = animation.startTime;
  if (startTime === null) {
    // Just started or resumed: the start time is set with the next frame
    // Only once: an animation whose element is not rendered (e.g. a hidden mobile tab) can stay pending after ready
    // resolves – retrying again would loop in microtasks and freeze the page (Arrakis 91 on phones)
    if (animation.pending && retryWhenReady) {
      animation.ready.then(() => alignToClock(animation, timing, false)).catch(() => {});
    }
    return;
  }
  if (typeof startTime === 'number') {
    const delay = Number(timing.delay) || 0;
    const aligned = Math.round((startTime + delay) / TICK_MILLISECONDS) * TICK_MILLISECONDS - delay;
    if (aligned !== startTime) {
      animation.startTime = aligned;
    }
  }
}

function pauseAnimation(animation: Animation, timing: AnimationTiming | undefined): void {
  animation.pause();
  pausedHere.add(animation);
  // A turn marker must not freeze half faded out: back to its first keyframe
  if (isTurnMarker(animation)) {
    animation.currentTime = -(Number(timing?.delay) || 0);
  }
}

/**
 * Puts every running endless animation on the clock (again after play(), which gives it a new start time), and pauses
 * it while the page is idle. Components that start or resume endless animations call it right after.
 */
export function tuneAmbientAnimations(): void {
  if (!supported()) {
    return;
  }
  // Read all, then write all (see alignToClock)
  const endless = document.getAnimations()
    .filter((animation) => animation.playState === 'running')
    .map((animation) => ({animation, timing: animation.effect?.getComputedTiming()}))
    .filter(({timing}) => isEndless(timing));
  for (const {animation, timing} of endless) {
    if (paused) {
      pauseAnimation(animation, timing);
    } else {
      alignToClock(animation, timing);
    }
  }
}

/** True while endless animations stand still because nobody uses the page */
export function isAmbientMotionPaused(): boolean {
  return paused;
}

function pauseAll(): void {
  paused = true;
  tuneAmbientAnimations();
}

function resumeAll(): void {
  paused = false;
  const resumed = [...pausedHere].filter((animation) => animation.playState === 'paused')
    .map((animation) => ({animation, timing: animation.effect?.getComputedTiming()}));
  pausedHere.clear();
  for (const {animation, timing} of resumed) {
    animation.play();
    // play() gives it a new start time: back on the grid once it is known
    alignToClock(animation, timing);
  }
}

function onActivity(): void {
  lastActivity = performance.now();
  if (paused && document.visibilityState === 'visible') {
    resumeAll();
  }
}

let scheduled = false;
// New CSS animations start with their elements (rendering, class changes): put them on the clock in the next frame
function onAnimationStart(): void {
  if (scheduled) {
    return;
  }
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    tuneAmbientAnimations();
  });
}

let installed = false;

/** Starts the clock and the idle pause for the whole page; once. */
export function installAmbientMotion(): void {
  if (installed || !supported()) {
    return;
  }
  installed = true;
  lastActivity = performance.now();
  for (const type of ACTIVITY_EVENTS) {
    window.addEventListener(type, onActivity, {passive: true, capture: true});
  }
  document.addEventListener('animationstart', onAnimationStart, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      pauseAll();
    } else {
      onActivity();
    }
  });
  window.setInterval(() => {
    if (!paused && performance.now() - lastActivity > IDLE_PAUSE_MILLISECONDS) {
      pauseAll();
    }
  }, IDLE_CHECK_MILLISECONDS);
  tuneAmbientAnimations();
}
