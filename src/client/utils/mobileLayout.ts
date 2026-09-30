import {ref} from 'vue';
import {startMobileDocument} from '@/client/utils/mobileDocument';

/*
 * Umschalter zwischen Desktop- und Mobil-Ansicht der Spieleransicht.
 *
 * Mobil-Ansicht bekommen Geräte, deren Hauptzeiger ein Finger ist (Handy, Tablet hoch und quer), sowie
 * Fenster schmaler als das Zwei-Spalten-Layout des Desktops (1400 px). Per URL-Parameter `?mobile=on|off|auto`
 * lässt sich das für diesen Tab überschreiben (sessionStorage); ein neuer Tab entscheidet wieder automatisch.
 */

export const MOBILE_LAYOUT_SETTINGS = ['auto', 'on', 'off'] as const;
export type MobileLayoutSetting = typeof MOBILE_LAYOUT_SETTINGS[number];

// Klasse am <html>-Element, solange die Mobil-Ansicht aktiv ist; alle Mobil-Stile hängen daran (mobile.less)
export const MOBILE_ROOT_CLASS = 'tm-mobile';

const STORAGE_KEY = 'mobile_layout';
const URL_PARAMETER = 'mobile';
const TOUCH_QUERY = '(pointer: coarse)';
// Unterhalb dieser Breite gibt es kein Zwei-Spalten-Layout (@player-home-columns-min-width, player_home_columns.less)
export const DESKTOP_MIN_WIDTH = 1400;
const NARROW_QUERY = `(max-width: ${DESKTOP_MIN_WIDTH - 1}px)`;

function isSetting(value: unknown): value is MobileLayoutSetting {
  return MOBILE_LAYOUT_SETTINGS.includes(value as MobileLayoutSetting);
}

// Gespeicherte Einstellung dieses Tabs; fehlender oder gesperrter Speicher gilt als 'auto'
function readSetting(): MobileLayoutSetting {
  try {
    // Frühere Versionen merkten sich die Einstellung dauerhaft; das hielt die Mobil-Ansicht auch auf breiten Fenstern fest
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
    // Privates Fenster o. Ä.: gilt dann nur für diese Seite
  }
}

function mediaQuery(query: string): MediaQueryList | undefined {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : undefined;
}

// True, wenn die Einstellung bzw. Gerät oder Fensterbreite die Mobil-Ansicht verlangen
export function resolveMobileLayout(setting: MobileLayoutSetting, touch: boolean, narrow: boolean): boolean {
  return setting === 'on' || (setting === 'auto' && (touch || narrow));
}

let setting: MobileLayoutSetting = 'auto';

/* Aktueller Zustand: true, solange die Mobil-Ansicht gilt. Reagiert auf Wechsel der Eingabeart (z. B. Maus am Tablet). */
export const mobileLayout = ref(false);

const DEVICE_VIEWPORT = 'width=device-width, initial-scale=1, viewport-fit=cover';
// Viewport-Angabe aus index.html (Desktop-Layout mit fester Breite), wiederhergestellt beim Verlassen der Mobil-Ansicht
let desktopViewport: string | undefined;

// Mobil-Ansicht rechnet mit der echten Gerätebreite statt der festen Desktop-Breite
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

// Beendet die laufenden Mobil-Anpassungen am Dokument (mobileDocument.ts), solange die Mobil-Ansicht gilt
let stopMobileDocument: (() => void) | undefined;

function update(): void {
  const mobile = resolveMobileLayout(setting, mediaQuery(TOUCH_QUERY)?.matches ?? false, mediaQuery(NARROW_QUERY)?.matches ?? false);
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
  applyViewport(mobile);
}

// Übernimmt `?mobile=…` aus der Adresse, entfernt den Parameter wieder und liefert die gültige Einstellung
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

/* Liest Einstellung und Gerät einmalig ein und hält `mobileLayout` danach aktuell. */
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
  // Manche Browser melden die Eingabeart erst nach dem Laden bzw. ohne change-Ereignis (Drehen, Andocken der Tastatur)
  window.addEventListener('resize', update);
  update();
}

/* Setzt die Einstellung für diesen Tab und wendet sie sofort an. */
export function setMobileLayoutSetting(value: MobileLayoutSetting): void {
  setting = value;
  writeSetting(value);
  update();
}
