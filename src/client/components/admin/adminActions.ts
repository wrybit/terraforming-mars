import {paths} from '@/common/app/paths';

// Server actions of the admin pages; errors carry the answer of the server so the page can show the cause
async function post(path: string): Promise<void> {
  const response = await fetch(path, {method: 'POST'});
  if (!response.ok) {
    throw new Error(await response.text() || `HTTP ${response.status}`);
  }
}

/** Ends the game server process; Docker starts it again, open pages show the update notice meanwhile. */
export function restartServer(): Promise<void> {
  return post(paths.API_ADMIN_RESTART);
}

/** Asks the update script of the server to deploy the newest commit (within a minute). */
export function requestServerUpdate(): Promise<void> {
  return post(paths.API_ADMIN_UPDATE);
}
