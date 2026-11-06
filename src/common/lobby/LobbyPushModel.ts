// Contract of the lobby's push messages between server (server/lobby/LobbyPush.ts, routes/ApiLobbyPush.ts),
// page (components/lobby/lobbyPush.ts) and service worker (client/sw.ts)

/** The browser's subscription as PushSubscription.toJSON() returns it */
export type LobbyPushSubscription = {
  endpoint: string;
  keys: {p256dh: string, auth: string};
};

/**
 * Texts in the language of the subscriber, sent along with the subscription: the server knows no translations.
 * ${0} stands for the name of whoever joined.
 */
export type LobbyPushTexts = {
  joinedTitle: string;
  joinedBody: string;
};

/** POST api/lobby-push: subscribe (subscription set) or unsubscribe (subscription null) */
export type LobbyPushRequest = {
  me: string;
  subscription: LobbyPushSubscription | null;
  texts?: LobbyPushTexts;
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
};
