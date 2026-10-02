/* Start page intro (sequence and timings in start_intro.less): on every load of the start page, except with
   reduced motion and in automated browsers (screenshots of the TM Screen-Viewer). */

// total duration of the intro (must match the timings in start_intro.less)
export const INTRO_DURATION = 1700;

export function shouldPlayIntro(): boolean {
  if (navigator.webdriver) {
    return false;
  }
  return !(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}
/** Offset from the logo's place to the screen center: it zooms in there first, then moves to its place. */
export function logoOffsetToCenter(logo: HTMLElement): {x: number, y: number} {
  const rect = logo.getBoundingClientRect();
  return {
    x: window.innerWidth / 2 - (rect.left + rect.width / 2),
    y: window.innerHeight / 2 - (rect.top + rect.height / 2),
  };
}
