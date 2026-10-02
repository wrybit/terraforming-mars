import {JSONObject} from '@/common/Types';
import {CreateGameModel} from '../CreateGameModel';
import {decodeSettingsLink} from './decodeSettingsLink';
import {encodeSettingsLink} from './encodeSettingsLink';

// Settings live in the hash instead of the query string: it never goes to the server,
// so there is no length limit there, and bookmarks still work.
const HASH_PREFIX = '#s=';

/** Returns the settings from the hash, or undefined if there are none. */
export function readSettingsFromHash(hash: string): JSONObject | undefined {
  if (!hash.startsWith(HASH_PREFIX)) {
    return undefined;
  }
  return decodeSettingsLink(hash.slice(HASH_PREFIX.length));
}

export function settingsHash(model: CreateGameModel): string {
  return HASH_PREFIX + encodeSettingsLink(model);
}

/** Writes the hash without a new history entry – a change should not cost a back step each time. */
export function replaceSettingsHash(hash: string): void {
  if (window.location.hash === hash) {
    return;
  }
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search + hash);
}
