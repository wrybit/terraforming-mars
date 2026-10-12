// Facts about the browser and the page, for bug reports (BugReportDialog.vue) and extensions.
import {ViewModel} from '@/common/models/PlayerModel';

/** Browser name and version from the user agent, e.g. "Chrome 141" or "Safari 18". */
export function browserName(userAgent: string = navigator.userAgent): string {
  const edge = /\b(Edg|OPR)\/(\d+)/.exec(userAgent);
  if (edge) {
    return `${edge[1] === 'Edg' ? 'Edge' : 'Opera'} ${edge[2]}`;
  }
  const firefox = /\bFirefox\/(\d+)/.exec(userAgent);
  if (firefox) {
    return `Firefox ${firefox[1]}`;
  }
  // iOS browsers are all Safari underneath; CriOS/FxiOS name the shell
  const chrome = /\b(Chrome|CriOS)\/(\d+)/.exec(userAgent);
  if (chrome) {
    return `Chrome ${chrome[2]}`;
  }
  const safari = /\bVersion\/(\d+(?:\.\d+)?).*Safari/.exec(userAgent);
  if (safari) {
    return `Safari ${safari[1]}`;
  }
  return userAgent;
}

/** Operating system with version where the user agent tells it. */
export function operatingSystem(userAgent: string = navigator.userAgent): string {
  const ios = /\b(?:iPhone|iPad|iPod).*? OS (\d+)_(\d+)/.exec(userAgent);
  if (ios) {
    return `iOS ${ios[1]}.${ios[2]}`;
  }
  const android = /\bAndroid (\d+(?:\.\d+)?)/.exec(userAgent);
  if (android) {
    return `Android ${android[1]}`;
  }
  // Recent browsers freeze macOS at 10_15_7; the major version is not known then
  if (/\bMac OS X\b/.test(userAgent)) {
    return 'macOS';
  }
  if (/\bWindows NT 10/.test(userAgent)) {
    return 'Windows 10/11';
  }
  if (/\bWindows\b/.test(userAgent)) {
    return 'Windows';
  }
  if (/\bCrOS\b/.test(userAgent)) {
    return 'ChromeOS';
  }
  if (/\bLinux\b/.test(userAgent)) {
    return 'Linux';
  }
  return 'unknown';
}

export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) !== null;
  } catch {
    return false;
  }
}

/**
 * Address of the page that can be shared: a player link would hand over the player's seat,
 * so it becomes the spectator link of the same game.
 */
export function shareableUrl(view: ViewModel | undefined, location: string = window.location.href): URL {
  const url = new URL(location);
  const spectatorId = view?.game.spectatorId;
  if (spectatorId && url.pathname.endsWith('/player') && url.searchParams.has('id')) {
    url.searchParams.set('id', spectatorId);
    url.pathname = url.pathname.replace(/player$/, 'spectator');
  }
  return url;
}
