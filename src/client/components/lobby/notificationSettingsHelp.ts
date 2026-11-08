// Where a blocked notification permission is changed back. Pages may not open the browser's settings (chrome://,
// about: and the like are blocked), so the lobby bar shows the way for the browser in use – also on phones.
// Each step is a chip with the words (and symbols) the browser itself shows, so they can be found on screen.

export type BrowserFamily = 'chromium' | 'arc' | 'android' | 'safari' | 'ios' | 'firefox';

/** Symbols drawn in the chips (LobbyPushBanner.vue), as the browsers show them */
export type StepIcon = 'lock' | 'sliders' | 'share';

export type SettingsStep = {
  icons?: ReadonlyArray<StepIcon>,
  label?: string,
  /** Proper name (browser, app name) instead of label: stays untranslated */
  name?: string,
};

export type SettingsPath = {
  /** Where to start, before the first chip */
  lead?: string,
  steps: ReadonlyArray<SettingsStep>,
  /** What is left to do after the last chip */
  tail?: string,
};

/**
 * touchPoints: navigator.maxTouchPoints – an iPad reports itself as a Mac and only differs by its touch screen.
 * arc: Arc has the user agent of Chrome; only its colour variables on the page give it away (isArcBrowser).
 */
export function browserFamily(userAgent: string, touchPoints: number = 0, arc: boolean = false): BrowserFamily {
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1)) {
    return 'ios';
  }
  if (/Android/.test(userAgent)) {
    return 'android';
  }
  if (/Firefox\//.test(userAgent)) {
    return 'firefox';
  }
  // Chrome, Edge, Arc, Brave and Opera also name Safari in their user agent, but always together with Chrome
  if (/Safari\//.test(userAgent) && !/Chrome\/|Chromium\/|Edg\//.test(userAgent)) {
    return 'safari';
  }
  return arc ? 'arc' : 'chromium';
}

/** Arc writes its theme colours as CSS variables onto every page – shortly after loading, so check again later */
export function isArcBrowser(root: HTMLElement = document.documentElement): boolean {
  return getComputedStyle(root).getPropertyValue('--arc-palette-title').trim() !== '';
}

const ALLOW: SettingsStep = {label: 'Allow'};
const NOTIFICATIONS: SettingsStep = {label: 'Notifications'};

/** Notifications blocked: where to allow them again */
export const BLOCKED_PATHS: Record<BrowserFamily, SettingsPath> = {
  chromium: {lead: 'Left of the address', steps: [{icons: ['lock', 'sliders']}, {label: 'Site settings'}, NOTIFICATIONS, ALLOW]},
  // Arc: the sliders sit at the right end of the address field, the menu lists the notifications directly
  arc: {lead: 'Right in the address field', steps: [{icons: ['sliders']}, NOTIFICATIONS, ALLOW]},
  android: {lead: 'Left of the address', steps: [{icons: ['lock', 'sliders']}, {label: 'Permissions'}, NOTIFICATIONS, ALLOW]},
  safari: {steps: [{name: 'Safari'}, {label: 'Settings'}, {label: 'Websites'}, NOTIFICATIONS, ALLOW]},
  // Name of the home screen app: short_name in assets/pwa/manifest.webmanifest
  ios: {steps: [{label: 'Settings'}, NOTIFICATIONS, {name: 'TM Mars'}, {label: 'Allow Notifications'}]},
  firefox: {lead: 'Left of the address', steps: [{icons: ['lock']}, NOTIFICATIONS, {label: 'Remove block'}], tail: 'Then reload the page.'},
};

/** No push at all: only iPhone and iPad have a way, the page added to the home screen */
export const UNSUPPORTED_PATHS: Partial<Record<BrowserFamily, SettingsPath>> = {
  ios: {
    steps: [{icons: ['share'], label: 'Share'}, {label: 'Add to Home Screen'}],
    tail: 'Then open the lobby from the new icon and allow notifications there.',
  },
};
