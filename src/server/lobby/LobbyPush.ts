import * as path from 'path';
import * as webpush from 'web-push';
import {LOBBY_PUSH_KINDS, LobbyPushKind, LobbyPushMessage, LobbyPushSubscription, LobbyPushText, LobbyPushTexts} from '../../common/lobby/LobbyPushModel';
import {fileStorage, LobbyStorage} from './lobbyStorage';
import {LobbyError} from './lobbyValidation';

/** A subscription nobody renewed (the page renews it on every visit) is forgotten after this time */
export const PUSH_SUBSCRIPTION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_TEXT_LENGTH = 200;
const DEFAULT_TEXTS: LobbyPushTexts = {
  joined: {title: '${0} joined your game', body: 'Your game in the lobby is waiting for you.'},
  request: {title: '${0} wants to join your game', body: 'Open the lobby to let them in or decline.'},
  started: {title: 'Your game has started', body: 'The game is waiting for you.'},
};

export type VapidKeys = {publicKey: string, privateKey: string};
type Subscriber = {subscription: LobbyPushSubscription, texts: LobbyPushTexts, at: number};
type Stored = {vapid?: VapidKeys, subscribers?: Record<string, Subscriber>};

/** Delivers one message; 'gone': the browser dropped the subscription (unsubscribed, data cleared) */
export type PushSender = (subscription: LobbyPushSubscription, message: LobbyPushMessage, vapid: VapidKeys) => Promise<'sent' | 'gone'>;

const webPushSender: PushSender = async (subscription, message, vapid) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(message), {
      // The push services need a contact; the address of the project is enough
      vapidDetails: {subject: process.env.LOBBY_PUSH_SUBJECT ?? 'https://github.com/wrybit/terraforming-mars', ...vapid},
      // A join is only interesting for a while
      TTL: 30 * 60,
      urgency: 'high',
    });
    return 'sent';
  } catch (error) {
    const status = (error as {statusCode?: number}).statusCode;
    if (status === 404 || status === 410) {
      return 'gone';
    }
    throw error;
  }
};

export function lobbyPushFile(): string {
  return process.env.LOBBY_PUSH_FILE ?? path.resolve('db', 'lobby-push.json');
}

function isSubscription(value: unknown): value is LobbyPushSubscription {
  const candidate = value as LobbyPushSubscription | undefined;
  return typeof candidate?.endpoint === 'string' && /^https:\/\//.test(candidate.endpoint) && candidate.endpoint.length < 1000 &&
    typeof candidate.keys?.p256dh === 'string' && typeof candidate.keys?.auth === 'string' &&
    candidate.keys.p256dh.length < 200 && candidate.keys.auth.length < 100;
}

// Missing or broken texts (also those stored before a kind existed) fall back to English
function cleanTexts(value: unknown): LobbyPushTexts {
  const texts = value as Partial<Record<LobbyPushKind, Partial<LobbyPushText>>> | undefined;
  const clean = (text: unknown, fallback: string) => typeof text === 'string' && text.trim() !== '' ? text.trim().slice(0, MAX_TEXT_LENGTH) : fallback;
  const result = {} as LobbyPushTexts;
  for (const kind of LOBBY_PUSH_KINDS) {
    result[kind] = {title: clean(texts?.[kind]?.title, DEFAULT_TEXTS[kind].title), body: clean(texts?.[kind]?.body, DEFAULT_TEXTS[kind].body)};
  }
  return result;
}

/**
 * Push messages of the lobby: a participant whose tab is in the background or closed learns what happened to the
 * own game (somebody joined or asks to join, the game started).
 * The key pair of the server (VAPID) and the subscriptions per participant live in db/lobby-push.json;
 * the key pair is made on first use and must stay, or every subscription stops working.
 */
export class LobbyPush {
  public static readonly INSTANCE = new LobbyPush();
  private data: Stored | undefined;

  constructor(
    private readonly clock: () => number = Date.now,
    private readonly send: PushSender = webPushSender,
    private readonly storage: LobbyStorage = fileStorage(lobbyPushFile()),
    private readonly makeKeys: () => VapidKeys = () => webpush.generateVAPIDKeys(),
  ) {}

  private stored(): Stored & {vapid: VapidKeys, subscribers: Record<string, Subscriber>} {
    if (this.data === undefined) {
      const saved = this.storage.load();
      this.data = typeof saved === 'object' && saved !== null ? saved as Stored : {};
    }
    const data = this.data;
    if (data.vapid === undefined) {
      data.vapid = this.makeKeys();
      this.storage.save(data);
    }
    data.subscribers = data.subscribers ?? {};
    return data as Stored & {vapid: VapidKeys, subscribers: Record<string, Subscriber>};
  }

  public publicKey(): string {
    return this.stored().vapid.publicKey;
  }

  /** subscription null: the participant no longer wants (or can get) push messages */
  public subscribe(me: string, subscription: unknown, texts: unknown): void {
    const data = this.stored();
    if (subscription === null) {
      delete data.subscribers[me];
    } else if (isSubscription(subscription)) {
      data.subscribers[me] = {subscription: {endpoint: subscription.endpoint, keys: {p256dh: subscription.keys.p256dh, auth: subscription.keys.auth}}, texts: cleanTexts(texts), at: this.clock()};
    } else {
      throw new LobbyError('Invalid subscription');
    }
    this.forgetOld();
    this.storage.save(data);
  }

  /** Whether a message would reach the participant even with the lobby closed */
  public canReach(me: string): boolean {
    const subscriber = this.stored().subscribers[me];
    return subscriber !== undefined && this.clock() - subscriber.at < PUSH_SUBSCRIPTION_MAX_AGE_MS;
  }

  /** Whether the participant is looking at the lobby right now decides the service worker */
  public async notify(participant: string, kind: LobbyPushKind, room: {id: string, path: string}, name: string): Promise<'sent' | 'gone' | 'unreachable'> {
    const data = this.stored();
    const subscriber = data.subscribers[participant];
    if (subscriber === undefined || !this.canReach(participant)) {
      return 'unreachable';
    }
    // Stored before the kind existed: English until the next visit of the lobby renews the texts
    const text = cleanTexts(subscriber.texts)[kind];
    const message: LobbyPushMessage = {
      title: text.title.replace('${0}', name),
      body: text.body.replace('${0}', name),
      url: room.path,
      tag: 'lobby-' + room.id,
    };
    const result = await this.send(subscriber.subscription, message, data.vapid);
    if (result === 'gone') {
      delete data.subscribers[participant];
      this.storage.save(data);
    }
    return result;
  }

  private forgetOld(): void {
    const data = this.stored();
    const now = this.clock();
    for (const [participant, subscriber] of Object.entries(data.subscribers)) {
      if (now - subscriber.at >= PUSH_SUBSCRIPTION_MAX_AGE_MS) {
        delete data.subscribers[participant];
      }
    }
  }
}
