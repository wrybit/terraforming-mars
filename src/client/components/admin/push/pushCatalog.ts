import {APP_NAME} from '@/common/constants';
import {LOBBY_PUSH_TEXTS, LobbyPushKind, LobbyPushText} from '@/common/lobby/LobbyPushModel';

// Every message the server can show a player, described for the admin page "Push" (AdminPush.vue).
// The texts of the messages come from LOBBY_PUSH_TEXTS, so the description cannot drift from what is sent.

export type PushChannel = 'push' | 'browser';

export type PushCatalogEntry = {
  kind: LobbyPushKind | 'turn';
  title: string;
  channel: PushChannel;
  /** Fires when, recipient, not sent, effect: label and text */
  rows: ReadonlyArray<{label: string, text: string}>;
  /** Where in the code it is sent (not translated) */
  code: string;
  /** value: shown as code next to the name (e.g. the tag) */
  parameters: ReadonlyArray<{name: string, value?: string, description: string}>;
  /** Relative to the app; undefined: the message opens nothing */
  deepLink: string | undefined;
  deepLinkNote: string;
  /** English: the keys of the translations */
  text: LobbyPushText;
};

const ROOM_LINK = '/lobby/room/<id>-<name>';
const SHOWN_AS = {label: 'Shown as', text: 'System notification; while a tab of this site is in front, a message inside the page instead.'};
const TAG = {name: 'tag', value: 'lobby-<id>', description: 'One notification per room: a new one replaces the old one.'};

export const PUSH_CATALOG: ReadonlyArray<PushCatalogEntry> = [
  {
    kind: 'joined',
    title: 'Somebody joined your game',
    channel: 'push',
    rows: [
      {label: 'Fires when', text: 'A player takes a free seat of an open game (list, quick start or invitation link).'},
      {label: 'Recipient', text: 'The host, only in the browser the game was created in.'},
      {label: 'Not sent', text: 'Without a subscription.'},
      SHOWN_AS,
      {label: 'Effect', text: 'A host reachable by push keeps the game 30 min with the lobby closed, otherwise 45 s.'},
    ],
    code: 'Lobby.join → notify(host, \'joined\')',
    parameters: [{name: '${0}', description: 'Name of whoever joined'}, TAG],
    deepLink: ROOM_LINK,
    deepLinkNote: 'Opens the waiting room.',
    text: LOBBY_PUSH_TEXTS.joined,
  },
  {
    kind: 'request',
    title: 'Somebody asks to join',
    channel: 'push',
    rows: [
      {label: 'Fires when', text: 'A player removed twice by the host tries to join again.'},
      {label: 'Recipient', text: 'The host, only in the browser the game was created in.'},
      {label: 'Not sent', text: 'Without a subscription.'},
      SHOWN_AS,
    ],
    code: 'Lobby.join → notify(host, \'request\')',
    parameters: [{name: '${0}', description: 'Name of whoever asks'}, TAG],
    deepLink: ROOM_LINK,
    deepLinkNote: 'Opens the waiting room with the request.',
    text: LOBBY_PUSH_TEXTS.request,
  },
  {
    kind: 'started',
    title: 'The game has started',
    channel: 'push',
    rows: [
      {label: 'Fires when', text: 'The host starts, the last seat gets ready, or a join fills the last seat.'},
      {label: 'Recipient', text: 'Everybody seated in the lobby, except whoever caused the start.'},
      {label: 'Not sent', text: 'Without a subscription. Never to players entered by hand.'},
      SHOWN_AS,
      {label: 'Effect', text: 'Players reachable by push keep their seat 30 min with the lobby closed.'},
    ],
    code: 'Lobby.start → notify(player, \'started\')',
    parameters: [{name: '${0}', description: 'Name of whoever started (not used in the texts)'}, TAG],
    deepLink: ROOM_LINK,
    deepLinkNote: 'The lobby forwards into the game.',
    text: LOBBY_PUSH_TEXTS.started,
  },
  {
    kind: 'turn',
    title: 'Your turn',
    channel: 'browser',
    rows: [
      {label: 'Fires when', text: 'The open game page notices that the player has to act.'},
      {label: 'Recipient', text: 'Only the open game tab: nothing arrives with the tab closed.'},
    ],
    code: 'WaitingFor.notify()',
    parameters: [],
    deepLink: undefined,
    deepLinkNote: 'None: the tab is already open.',
    text: {title: APP_NAME, body: 'It\'s your turn!'},
  },
];
