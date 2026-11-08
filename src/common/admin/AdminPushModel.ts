import {LobbyPushKind, LobbyPushResult} from '../lobby/LobbyPushModel';

// Contract between the admin API (routes/ApiAdminPush.ts) and the admin page "Push" (components/admin/push/)

/** One message the server tried to send */
export type AdminPushDelivery = {
  at: number;
  kind: LobbyPushKind;
  roomId: string;
  roomTitle: string;
  /** Start of the participant id only: enough to tell browsers apart */
  participant: string;
  result: LobbyPushResult;
};

/** GET api/admin/push */
export type AdminPushInfo = {
  subscribers: number;
  subscriptionMaxAgeDays: number;
  /** Picture the messages carry (the server's favicon), relative to the app */
  icon: string;
  /** Newest first */
  deliveries: ReadonlyArray<AdminPushDelivery>;
};

/** POST api/admin/push: a sample message of this kind to the browser of this lobby participant */
export type AdminPushTestRequest = {
  kind: LobbyPushKind;
  me: string;
};

export type AdminPushTestResponse = {
  result: LobbyPushResult;
};
