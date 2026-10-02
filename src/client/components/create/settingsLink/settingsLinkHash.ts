import {JSONObject} from '@/common/Types';
import {CreateGameModel} from '../CreateGameModel';
import {decodeSettingsLink} from './decodeSettingsLink';
import {encodeSettingsLink} from './encodeSettingsLink';

// Einstellungen stehen im Hash statt im Query-String: der geht nie an den Server,
// dort gibt es also keine Längengrenze, und Lesezeichen funktionieren trotzdem.
const HASH_PREFIX = '#s=';

/** Liefert die Einstellungen aus dem Hash oder undefined, wenn keine drinstehen. */
export function readSettingsFromHash(hash: string): JSONObject | undefined {
  if (!hash.startsWith(HASH_PREFIX)) {
    return undefined;
  }
  return decodeSettingsLink(hash.slice(HASH_PREFIX.length));
}

export function settingsHash(model: CreateGameModel): string {
  return HASH_PREFIX + encodeSettingsLink(model);
}

/** Schreibt den Hash ohne neuen Verlaufseintrag – jede Änderung soll nicht einen Zurück-Schritt kosten. */
export function replaceSettingsHash(hash: string): void {
  if (window.location.hash === hash) {
    return;
  }
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search + hash);
}
