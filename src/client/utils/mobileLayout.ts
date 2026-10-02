import {ref} from 'vue';
import {startMobileDocument} from '@/client/utils/mobileDocument';
import {LANDSCAPE_MIN_WIDTH} from '@/client/utils/mobileFit';

/*
 * Switch between desktop and mobile view of the player view.
 *
 * The mobile view is used on devices whose primary pointer is a finger (phone, tablet portrait and landscape), and on
 * windows narrower than the desktop two-column layout (1400 px). The URL parameter `?mobile=on|off|auto`
 * overrides this for this tab (sessionStorage); a new tab decides automatically again.
 */

export const MOBILE_LAYOUT_SETTINGS = ['auto', 'on', 'off'] as const;
export type MobileLayoutSetting = typeof MOBILE_LAYOUT_SETTINGS[number];

// Class on the <html> element while the mobile view is active; all mobile styles hang off it (mobile.less)
export const MOBILE_ROOT_CLASS = 'tm-mobile';

const STORAGE_KEY = 'mobile_layout';
const URL_PARAMETER = 'mobile';
const TOUCH_QUERY = '(pointer: coarse)';
// Below this width there is no two-column layout (@player-home-columns-min-width, player_home_columns.less)
export const DESKTOP_MIN_WIDTH = 1400;
const NARROW_QUERY = `(max-width: ${DESKTOP_MIN_WIDTH - 1}px)`;
// Same condition as @mb-landscape in mobile.less
const LANDSCAPE_QUERY = `(min-width: ${LANDSCAPE_MIN_WIDTH}px) and (orientation: landscape)`;

function isSetting(value: unknown): value is MobileLayoutSetting {
  return MOBILE_LAYOUT_SETTINGS.includes(value as MobileLayoutSetting);
}

// Stored setting of this tab; missing or blocked storage counts as 'auto'
function readSetting(): MobileLayoutSetting {
  try {
    // Earlier versions stored the setting permanently; that kept the mobile view even on wide windows
    localStorage.removeItem(STORAGE_KEY);
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return isSetting(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

function writeSetting(setting: MobileLayoutSetting): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, setting);
  } catch {
    // Private window or similar: then applies only to this page
  }
}

function mediaQuery(query: string): MediaQueryList | undefined {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : undefined;
}

// True if the setting, or device or window width, calls for the mobile view
export function resolveMobileLayout(setting: MobileLayoutSetting, touch: boolean, narrow: boolean): boolean {
  return setting === 'on' || (setting === 'auto' && (touch || narrow));
}

let setting: MobileLayoutSetting = 'auto';

/* Current state: true while the mobile view applies. Reacts to changes of input mode (e.g. mouse on a tablet). */
export const mobileLayout = ref(false);

/* True in landscape from LANDSCAPE_MIN_WIDTH (tablet landscape): player tables then stay horizontal as on desktop. */
export const mobileLandscape = ref(false);

const DEVICE_VIEWPORT = 'width=device-width, initial-scale=1, viewport-fit=cover';
// Viewport setting from index.html (desktop layout with fixed width), restored when leaving the mobile view
let desktopViewport: string | undefined;

// Mobile view uses the real device width instead of the fixed desktop width
function applyViewport(mobile: boolean): void {
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta === null) {
    return;
  }
  desktopViewport ??= meta.getAttribute('content') ?? '';
  const wanted = mobile ? DEVICE_VIEWPORT : desktopViewport;
  if (meta.getAttribute('content') !== wanted) {
    meta.setAttribute('content', wanted);
  }
}

// Ends the running mobile adjustments to the document (mobileDocument.ts) while the mobile view applies
let stopMobileDocument: (() => void) | undefined;

function update(): void {
  const mobile = resolveMobileLayout(setting, mediaQuery(TOUCH_QUERY)?.matches ?? false, mediaQuery(NARROW_QUERY)?.matches ?? false);
  if (mobile !== mobileLayout.value) {
    mobileLayout.value = mobile;
  }
  const landscape = mediaQuery(LANDSCAPE_QUERY)?.matches ?? false;
  if (landscape !== mobileLandscape.value) {
    mobileLandscape.value = landscape;
  }
  if (mobile && stopMobileDocument === undefined) {
    stopMobileDocument = startMobileDocument(document.body);
  } else if (!mobile && stopMobileDocument !== undefined) {
    stopMobileDocument();
    stopMobileDocument = undefined;
  }
  document.documentElement.classList.toggle(MOBILE_ROOT_CLASS, mobile);
  applyViewport(mobile);
}

// Takes `?mobile=…` from the address, removes the parameter again and returns the effective setting
function settingFromUrl(): MobileLayoutSetting | undefined {
  const url = new URL(window.location.href);
  const value = url.searchParams.get(URL_PARAMETER);
  if (!isSetting(value)) {
    return undefined;
  }
  url.searchParams.delete(URL_PARAMETER);
  window.history.replaceState(window.history.state, '', url.toString());
  return value;
}

let initialized = false;

/* Reads setting and device once and keeps `mobileLayout` up to date afterwards. */
export function initMobileLayout(): void {
  if (initialized || typeof window === 'undefined') {
    return;
  }
  initialized = true;
  const fromUrl = settingFromUrl();
  if (fromUrl !== undefined) {
    writeSetting(fromUrl);
  }
  setting = fromUrl ?? readSetting();
  mediaQuery(TOUCH_QUERY)?.addEventListener('change', update);
  mediaQuery(NARROW_QUERY)?.addEventListener('change', update);
  mediaQuery(LANDSCAPE_QUERY)?.addEventListener('change', update);
  // Some browsers report the input mode only after loading or without a change event (rotating, docking the keyboard)
  window.addEventListener('resize', update);
  update();
}

/* Sets the setting for this tab and applies it immediately. */
export function setMobileLayoutSetting(value: MobileLayoutSetting): void {
  setting = value;
  writeSetting(value);
  update();
}
