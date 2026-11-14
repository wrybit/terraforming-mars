import {ref} from 'vue';
import {startMobileDocument} from '@/client/utils/mobileDocument';
import {BREAKPOINTS, fromWidth} from '@/client/utils/breakpoints';

/*
 * Layout state of the app, decided by the window size alone (breakpoints.less / breakpoints.ts):
 *
 *   phone-portrait    narrower than BREAKPOINTS.tablet
 *   phone-landscape   landscape and lower than BREAKPOINTS.shortHeight
 *   tablet-portrait   portrait from BREAKPOINTS.tablet
 *   tablet-landscape  landscape from BREAKPOINTS.shortHeight
 *   desktop           from BREAKPOINTS.desktop (HD laptops with 1280 and 1366 px included)
 *
 * The four phone and tablet states use the mobile view (class tm-mobile, mobile.less), the desktop state the
 * two-column layout. Input devices don't matter: a tablet wide enough gets the desktop layout, a narrow window
 * with a mouse the tablet layout. The viewport is always the device width (index.html), so CSS media queries and
 * this script measure the same width.
 */

export type LayoutState = 'phone-portrait' | 'phone-landscape' | 'tablet-portrait' | 'tablet-landscape' | 'desktop';

// Class on the <html> element while the mobile view is active; all mobile styles hang off it (mobile.less)
export const MOBILE_ROOT_CLASS = 'tm-mobile';

// Queries whose change can change the state; each is watched
const WATCHED_QUERIES = [
  '(orientation: landscape)',
  fromWidth(BREAKPOINTS.tablet),
  fromWidth(BREAKPOINTS.desktop),
  `(min-height: ${BREAKPOINTS.shortHeight}px)`,
];

/* Layout state for a window of `width` × `height` px. */
export function resolveLayoutState(width: number, height: number): LayoutState {
  if (width >= BREAKPOINTS.desktop) {
    return 'desktop';
  }
  if (width > height) {
    return height < BREAKPOINTS.shortHeight ? 'phone-landscape' : 'tablet-landscape';
  }
  return width < BREAKPOINTS.tablet ? 'phone-portrait' : 'tablet-portrait';
}

/* Current state; reacts to resizing and rotating. */
export const layoutState = ref<LayoutState>('desktop');

/* True while the mobile view applies (every state except desktop). */
export const mobileLayout = ref(false);

// Ends the running mobile adjustments to the document (mobileDocument.ts) while the mobile view applies
let stopMobileDocument: (() => void) | undefined;

function update(): void {
  const state = resolveLayoutState(window.innerWidth, window.innerHeight);
  const mobile = state !== 'desktop';
  if (state !== layoutState.value) {
    layoutState.value = state;
  }
  if (mobile !== mobileLayout.value) {
    mobileLayout.value = mobile;
  }
  if (mobile && stopMobileDocument === undefined) {
    stopMobileDocument = startMobileDocument(document.body);
  } else if (!mobile && stopMobileDocument !== undefined) {
    stopMobileDocument();
    stopMobileDocument = undefined;
  }
  document.documentElement.classList.toggle(MOBILE_ROOT_CLASS, mobile);
  document.documentElement.dataset.layout = state;
}

let initialized = false;

/* Decides the state once and keeps `layoutState` and `mobileLayout` up to date afterwards. */
export function initMobileLayout(): void {
  if (initialized || typeof window === 'undefined') {
    return;
  }
  initialized = true;
  if (typeof window.matchMedia === 'function') {
    for (const query of WATCHED_QUERIES) {
      window.matchMedia(query).addEventListener('change', update);
    }
  }
  // Some browsers report a rotation only as a resize
  window.addEventListener('resize', update);
  update();
}

