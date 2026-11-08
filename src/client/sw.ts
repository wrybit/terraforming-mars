import {LOBBY_PUSH_OUTCOME, LobbyPushMessage, LobbyPushOutcome} from '@/common/lobby/LobbyPushModel';

// Service worker: shows the lobby's push messages (server/lobby/LobbyPush.ts) and brings the host back to the
// game on a click. The page notifications of the game (WaitingFor.vue) use it as a fallback as well.

// The project compiles against the DOM types; these are the few worker types used here
type WaitableEvent = Event & {waitUntil(promise: Promise<unknown>): void};
type PushEventLike = WaitableEvent & {data: {json(): unknown} | null};
type NotificationEventLike = WaitableEvent & {notification: Notification & {data: unknown}};
type WindowClientLike = {url: string, focused: boolean, visibilityState: string, focus(): Promise<unknown>, navigate(url: string): Promise<unknown>, postMessage(message: unknown): void};
type WorkerScope = {
  registration: ServiceWorkerRegistration;
  clients: {
    matchAll(options: {type: 'window', includeUncontrolled: boolean}): Promise<ReadonlyArray<WindowClientLike>>;
    openWindow(url: string): Promise<unknown>;
    claim(): Promise<void>;
  };
  skipWaiting(): Promise<void>;
  addEventListener(type: string, listener: (event: never) => void): void;
};

const worker = self as unknown as WorkerScope;

// A new version takes over at once instead of waiting until every tab is closed
worker.addEventListener('install', () => {
  void worker.skipWaiting();
});
worker.addEventListener('activate', (event: WaitableEvent) => {
  event.waitUntil(worker.clients.claim());
});

function isLobbyPage(client: WindowClientLike): boolean {
  return new URL(client.url).pathname.includes('/lobby');
}

async function showPush(message: LobbyPushMessage): Promise<void> {
  // Somebody looking at the lobby right now sees the join there; a background tab or a closed one gets the message
  const clients = await worker.clients.matchAll({type: 'window', includeUncontrolled: true});
  let outcome: LobbyPushOutcome['outcome'] = 'shown';
  if (clients.some((client) => isLobbyPage(client) && client.focused && client.visibilityState === 'visible')) {
    outcome = 'suppressed';
  } else {
    try {
      // renotify is missing from the DOM types of TypeScript, the browsers know it
      const options: Parameters<ServiceWorkerRegistration['showNotification']>[1] & {renotify: boolean} = {
        body: message.body,
        tag: message.tag,
        // A newer message of the same room replaces the old one, but must still alert: without this the browser
        // swaps it silently into the notification centre (no banner, no sound)
        renotify: true,
        icon: new URL('favicon.ico', worker.registration.scope).href,
        data: {url: new URL(message.url, worker.registration.scope).href},
      };
      await worker.registration.showNotification(message.title, options);
    } catch {
      outcome = 'failed';
    }
  }
  // Open pages learn what became of the message: the admin test tells where a missing notification got stuck
  const report: LobbyPushOutcome = {type: LOBBY_PUSH_OUTCOME, tag: message.tag, outcome};
  clients.forEach((client) => client.postMessage(report));
}

worker.addEventListener('push', (event: PushEventLike) => {
  const message = event.data?.json() as LobbyPushMessage | undefined;
  if (message?.title !== undefined) {
    event.waitUntil(showPush(message));
  }
});

// A click opens the game: in a lobby tab that is still open, otherwise in a new one
async function openGame(url: string): Promise<void> {
  const clients = await worker.clients.matchAll({type: 'window', includeUncontrolled: true});
  const lobby = clients.find(isLobbyPage);
  if (lobby !== undefined) {
    try {
      await lobby.navigate(url);
      await lobby.focus();
      return;
    } catch {
      // A tab this worker does not control yet cannot be steered: a new one then
    }
  }
  await worker.clients.openWindow(url);
}

worker.addEventListener('notificationclick', (event: NotificationEventLike) => {
  const url = (event.notification.data as {url?: unknown} | null)?.url;
  event.notification.close();
  if (typeof url === 'string') {
    event.waitUntil(openGame(url));
  }
});
