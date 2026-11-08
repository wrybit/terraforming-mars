// Where a blocked notification permission is changed back. Pages may not open the browser's settings (chrome://,
// about: and the like are blocked), so the lobby bar describes the way for the browser in use – also on phones.

export type BrowserFamily = 'chromium' | 'android' | 'safari' | 'ios' | 'firefox';

/** touchPoints: navigator.maxTouchPoints – an iPad reports itself as a Mac and only differs by its touch screen */
export function browserFamily(userAgent: string, touchPoints: number = 0): BrowserFamily {
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
  return 'chromium';
}

/** Notifications blocked: where to allow them again */
export const BLOCKED_STEPS: Record<BrowserFamily, string> = {
  chromium: 'Click the icon left of the address (lock or sliders) → Site settings → Notifications: Allow.',
  android: 'Tap the icon left of the address (lock or sliders) → Permissions → Notifications: Allow.',
  safari: 'Safari → Settings → Websites → Notifications: set this site to Allow.',
  // Name of the home screen app: short_name in assets/pwa/manifest.webmanifest
  ios: 'iPhone or iPad settings → Notifications → TM Mars: Allow Notifications.',
  firefox: 'Click the lock left of the address → remove the block for notifications, then reload the page.',
};

/** No push at all: only iPhone and iPad have a way, the page added to the home screen */
export const UNSUPPORTED_STEPS: Partial<Record<BrowserFamily, string>> = {
  ios: 'On iPhone and iPad: tap Share → Add to Home Screen, open the lobby from the new icon and allow notifications there.',
};
