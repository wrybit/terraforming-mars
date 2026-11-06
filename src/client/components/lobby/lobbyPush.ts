import {paths} from '@/common/app/paths';
import {LobbyPushInfo, LobbyPushRequest, LobbyPushSubscription} from '@/common/lobby/LobbyPushModel';
import {translateText} from '@/client/directives/i18n';
import {fetchOrFail} from '@/client/utils/requestFailure';
import {lobbyParticipantId} from './lobbyProfile';

// Push messages of the lobby (server: lobby/LobbyPush.ts, routes/ApiLobbyPush.ts; display: client/sw.ts).
// A host learns that somebody joined, also with the lobby in the background or closed.

function pushSupported(): boolean {
  return window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Asks the browser for permission. Must run in the click that opens a game (browsers ask only after a user
 * action), before anything is awaited; the answer is used by subscribeLobbyPush afterwards.
 */
export function askLobbyPushPermission(): Promise<string> | undefined {
  if (!pushSupported() || Notification.permission !== 'default') {
    return undefined;
  }
  return Notification.requestPermission();
}

// The key arrives as base64url; the browser wants the raw bytes
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + '='.repeat((4 - base64url.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

function sameKey(subscription: PushSubscription, key: Uint8Array): boolean {
  const current = subscription.options.applicationServerKey;
  if (current === null) {
    return false;
  }
  const bytes = new Uint8Array(current);
  return bytes.length === key.length && bytes.every((byte, index) => byte === key[index]);
}

async function send(request: Omit<LobbyPushRequest, 'me'>): Promise<void> {
  await fetchOrFail(paths.API_LOBBY_PUSH, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({...request, me: lobbyParticipantId()}),
  });
}

/**
 * Registers (or renews) the subscription of this browser, if the permission is given. Runs on every visit of the
 * lobby, so the server keeps it and the texts follow the chosen language. Failures stay silent: the lobby
 * works without push messages, only the host then has to keep it open.
 */
export async function subscribeLobbyPush(): Promise<void> {
  if (!pushSupported() || Notification.permission !== 'granted') {
    return;
  }
  try {
    // Subscribing needs an active worker: on the very first visit it is still installing
    await navigator.serviceWorker.register('sw.js');
    const registration = await navigator.serviceWorker.ready;
    const info: LobbyPushInfo = await (await fetchOrFail(paths.API_LOBBY_PUSH)).json();
    const key = keyBytes(info.publicKey);
    let subscription = await registration.pushManager.getSubscription();
    // A server with a new key pair cannot reach the old subscription
    if (subscription !== null && !sameKey(subscription, key)) {
      await subscription.unsubscribe();
      subscription = null;
    }
    subscription = subscription ?? await registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: key});
    await send({
      subscription: subscription.toJSON() as LobbyPushSubscription,
      texts: {joinedTitle: translateText('${0} joined your game'), joinedBody: translateText('Your game in the lobby is waiting for you.')},
    });
  } catch (error) {
    console.warn('Lobby push messages are not available', error);
  }
}
