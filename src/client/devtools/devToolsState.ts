// DevTools on or off (Jens, 20 Oct 2026): switched on in the browser console with tmDev.on(), only with the admin login.
// The server checks the login again for every change (routes/ApiDevTools.ts); this flag only shows the tab.
import {reactive} from 'vue';
import {paths} from '@/common/app/paths';
import {AdminSessionStatus} from '@/common/admin/adminLogin';

// open: the DevTools tab is the shown one in the action tabs (DevToolsTab.vue); kept here, so it stays open while
// the action menu is drawn anew after a change
export const devToolsState = reactive({enabled: false, open: false});

// Remembered on this device, so the tab survives a reload; checked against the admin login on every page load
const STORAGE_KEY = 'tm-devtools';

function remember(on: boolean): void {
  try {
    if (on) {
      localStorage.setItem(STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Blocked storage (private mode): the tab then lasts until the next reload
  }
}

export function remembered(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

async function isAdmin(): Promise<boolean> {
  try {
    const response = await fetch(paths.API_ADMIN_SESSION);
    const status = await response.json() as AdminSessionStatus;
    return status.admin === true;
  } catch {
    return false;
  }
}

export async function enableDevTools(): Promise<boolean> {
  if (!await isAdmin()) {
    console.warn('DevTools: only with the admin login (menu → Admin).');
    devToolsState.enabled = false;
    return false;
  }
  devToolsState.enabled = true;
  remember(true);
  return true;
}

export function disableDevTools(): void {
  devToolsState.enabled = false;
  devToolsState.open = false;
  remember(false);
}

export function openDevTools(): void {
  devToolsState.open = true;
}

export function closeDevTools(): void {
  devToolsState.open = false;
}

declare global {
  interface Window {
    tmDev?: {on(): Promise<boolean>, off(): void};
  }
}

/** Console commands tmDev.on() / tmDev.off(); switches on again after a reload if it was on and the login holds */
export function installDevToolsConsole(): void {
  window.tmDev = {on: enableDevTools, off: disableDevTools};
  if (remembered()) {
    void enableDevTools();
  }
}
