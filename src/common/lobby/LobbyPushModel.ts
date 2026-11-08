// Contract of the lobby's push messages between server (server/lobby/LobbyPush.ts, routes/ApiLobbyPush.ts),
// page (components/lobby/lobbyPush.ts) and service worker (client/sw.ts)

/** The browser's subscription as PushSubscription.toJSON() returns it */
export type LobbyPushSubscription = {
  endpoint: string;
  keys: {p256dh: string, auth: string};
};

/** What a message is about: somebody joined (to the host), asks to join (to the host), the game started (to the others) */
export type LobbyPushKind = 'joined' | 'request' | 'started';

export const LOBBY_PUSH_KINDS: ReadonlyArray<LobbyPushKind> = ['joined', 'request', 'started'];

/**
 * Texts in the language of the subscriber, sent along with the subscription: the server knows no translations.
 * ${0} stands for the name of whoever caused the message.
 */
export type LobbyPushText = {title: string, body: string};
export type LobbyPushTexts = Record<LobbyPushKind, LobbyPushText>;

/**
 * The texts in English: the keys of the translations (page), the fallback of the server and the admin preview.
 * One source, so the three never drift apart.
 */
export const LOBBY_PUSH_TEXTS: LobbyPushTexts = {
  joined: {title: '${0} joined your game', body: 'Your game in the lobby is waiting for you.'},
  request: {title: '${0} wants to join your game', body: 'Open the lobby to let them in or decline.'},
  started: {title: 'Your game has started', body: 'The game is waiting for you.'},
};

/** What became of one message: delivered to the push service, browser dropped the subscription, nobody to reach, switched off by the player */
export type LobbyPushResult = 'sent' | 'gone' | 'unreachable' | 'muted';

/** POST api/lobby-push: subscribe (subscription set) or unsubscribe (subscription null) */
export type LobbyPushRequest = {
  me: string;
  subscription: LobbyPushSubscription | null;
  texts?: LobbyPushTexts;
  /** Kinds the player switched off in the settings: the server does not send them */
  muted?: ReadonlyArray<LobbyPushKind>;
};

/** GET api/lobby-push: the server's public key (VAPID) */
export type LobbyPushInfo = {
  publicKey: string;
};

/** What the service worker receives */
export type LobbyPushMessage = {
  title: string;
  body: string;
  /** Room page relative to the app (lobby/room/<id>-<name>) */
  url: string;
  /** One notification per room: a second join replaces the first */
  tag: string;
  /** Picture of the notification relative to the app: the favicon chosen in the admin settings (PNG, not .ico) */
  icon?: string;
};

/** Tag of the admin's test messages (routes/ApiAdminPush.ts): the admin page waits for its outcome */
export const LOBBY_PUSH_TEST_TAG = 'lobby-admin-test';

export const LOBBY_PUSH_OUTCOME = 'lobby-push-outcome';

/**
 * Service worker → open pages: the message arrived and was shown by the system, shown as a toast in a tab of this
 * site that is in front, or refused by the browser
 */
export type LobbyPushOutcome = {
  type: typeof LOBBY_PUSH_OUTCOME;
  tag: string;
  outcome: 'shown' | 'toast' | 'failed';
};

export const LOBBY_PUSH_TOAST = 'lobby-push-toast';

/** Service worker → the tab in front: show the message inside the page (PushToast.vue) instead of a system notice */
export type LobbyPushToast = {
  type: typeof LOBBY_PUSH_TOAST;
  message: LobbyPushMessage;
};
