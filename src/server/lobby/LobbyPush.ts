import * as path from 'path';
import * as webpush from 'web-push';
import {LOBBY_PUSH_KINDS, LOBBY_PUSH_TEXTS, LobbyPushKind, LobbyPushMessage, LobbyPushResult, LobbyPushSubscription, LobbyPushText, LobbyPushTexts} from '../../common/lobby/LobbyPushModel';
import {AdminPushDelivery, AdminPushInfo} from '../../common/admin/AdminPushModel';
import {faviconImage} from '../../common/admin/favicons';
import {fileStorage, LobbyStorage} from './lobbyStorage';
import {LobbyError} from './lobbyValidation';

/** A subscription nobody renewed (the page renews it on every visit) is forgotten after this time */
export const PUSH_SUBSCRIPTION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_TEXT_LENGTH = 200;
const DEFAULT_TEXTS = LOBBY_PUSH_TEXTS;
/** The admin page shows this many of the latest messages */
export const MAX_DELIVERIES = 50;
const PARTICIPANT_SHOWN = 6;

export type VapidKeys = {publicKey: string, privateKey: string};
type Subscriber = {subscription: LobbyPushSubscription, texts: LobbyPushTexts, at: number, muted?: Array<LobbyPushKind>};
type Stored = {vapid?: VapidKeys, subscribers?: Record<string, Subscriber>, deliveries?: Array<AdminPushDelivery>};
/** Room as the lobby passes it: id, link of the room page, name for the admin page */
export type LobbyPushRoom = {id: string, path: string, title: string};

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

/** The favicon of this server as PNG: notifications show no .ico on every system (settings FAVICON_ICON/FAVICON_COLOR) */
export function pushIcon(): string {
  return faviconImage(process.env.FAVICON_ICON, process.env.FAVICON_COLOR);
}

export function lobbyPushFile(): string {
  return process.env.LOBBY_PUSH_FILE ?? path.resolve('db', 'lobby-push.json');
}

function isSubscription(value: unknown): value is LobbyPushSubscription {
  const candidate = value as LobbyPushSubscription | undefined;
  return typeof candidate?.endpoint === 'string' && /^https:\/\//.test(candidate.endpoint) && candidate.endpoint.length < 1000 &&
    typeof candidate.keys?.p256dh === 'string' && typeof candidate.keys?.auth === 'string' &&
    candidate.keys.p256dh.length < 200 && candidate.keys.auth.length < 100;
}

// Only known kinds, each once
function cleanMuted(value: unknown): Array<LobbyPushKind> {
  return Array.isArray(value) ? LOBBY_PUSH_KINDS.filter((kind) => value.includes(kind)) : [];
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
  public subscribe(me: string, subscription: unknown, texts: unknown, muted: unknown = []): void {
    const data = this.stored();
    if (subscription === null) {
      delete data.subscribers[me];
    } else if (isSubscription(subscription)) {
      data.subscribers[me] = {subscription: {endpoint: subscription.endpoint, keys: {p256dh: subscription.keys.p256dh, auth: subscription.keys.auth}}, texts: cleanTexts(texts), at: this.clock(), muted: cleanMuted(muted)};
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

  /**
   * Whether the participant is looking at the lobby right now decides the service worker.
   * record: false for test messages from the admin page, they stay out of its list of deliveries and ignore
   * kinds the participant switched off.
   */
  public async notify(participant: string, kind: LobbyPushKind, room: LobbyPushRoom, name: string, record: boolean = true): Promise<LobbyPushResult> {
    const muted = record && this.stored().subscribers[participant]?.muted?.includes(kind) === true;
    const result = muted ? 'muted' : await this.deliver(participant, kind, room, name);
    if (record) {
      const data = this.stored();
      const delivery: AdminPushDelivery = {at: this.clock(), kind, roomId: room.id, roomTitle: room.title, participant: participant.slice(0, PARTICIPANT_SHOWN), result};
      data.deliveries = [delivery, ...(data.deliveries ?? [])].slice(0, MAX_DELIVERIES);
      this.storage.save(data);
    }
    return result;
  }

  /** For the admin page: how many browsers can be reached and what was sent lately */
  public info(): AdminPushInfo {
    this.forgetOld();
    const data = this.stored();
    return {
      subscribers: Object.keys(data.subscribers).length,
      subscriptionMaxAgeDays: PUSH_SUBSCRIPTION_MAX_AGE_MS / (24 * 60 * 60 * 1000),
      icon: pushIcon(),
      deliveries: data.deliveries ?? [],
    };
  }

  private async deliver(participant: string, kind: LobbyPushKind, room: LobbyPushRoom, name: string): Promise<LobbyPushResult> {
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
      icon: pushIcon(),
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
