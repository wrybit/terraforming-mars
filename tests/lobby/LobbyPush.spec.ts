import {expect} from 'chai';
import {LobbyPush, PUSH_SUBSCRIPTION_MAX_AGE_MS, PushSender} from '../../src/server/lobby/LobbyPush';
import {memoryStorage} from '../../src/server/lobby/lobbyStorage';
import {LobbyError} from '../../src/server/lobby/lobbyValidation';
import {LobbyPushMessage} from '../../src/common/lobby/LobbyPushModel';

const HOST = 'hosthosthosthost01';
const subscription = {endpoint: 'https://push.example/abc', keys: {p256dh: 'key', auth: 'secret'}};
const texts = {joined: {title: '${0} ist da', body: '${0} ist deinem Spiel beigetreten'}};
const room = {id: 'ab12', path: 'lobby/room/ab12-Abend'};

describe('LobbyPush', () => {
  let now: number;
  let sent: Array<LobbyPushMessage>;
  let answer: 'sent' | 'gone';
  let storage: ReturnType<typeof memoryStorage>;
  let push: LobbyPush;

  beforeEach(() => {
    now = 1_000_000;
    sent = [];
    answer = 'sent';
    storage = memoryStorage();
    const sender: PushSender = async (_subscription, message) => {
      sent.push(message);
      return answer;
    };
    push = new LobbyPush(() => now, sender, storage, () => ({publicKey: 'public', privateKey: 'private'}));
  });

  it('keeps one key pair and sends the join in the language of the host', async () => {
    expect(push.publicKey()).eq('public');
    push.subscribe(HOST, subscription, texts);
    expect(push.canReach(HOST)).is.true;
    await push.notify(HOST, 'joined', {...room, title: 'Abend'}, 'Bob');
    expect(sent).deep.eq([{title: 'Bob ist da', body: 'Bob ist deinem Spiel beigetreten', url: room.path, tag: 'lobby-ab12', icon: 'assets/favicon/mars-orange.png'}]);
    expect((storage.data as {vapid: unknown}).vapid).deep.eq({publicKey: 'public', privateKey: 'private'});
  });

  it('refuses odd subscriptions and forgets gone, cancelled and old ones', async () => {
    expect(() => push.subscribe(HOST, {endpoint: 'http://insecure'}, texts)).to.throw(LobbyError);
    push.subscribe(HOST, subscription, texts);
    answer = 'gone';
    await push.notify(HOST, 'joined', {...room, title: 'Abend'}, 'Bob');
    expect(push.canReach(HOST)).is.false;
    push.subscribe(HOST, subscription, texts);
    push.subscribe(HOST, null, undefined);
    expect(push.canReach(HOST)).is.false;
    push.subscribe(HOST, subscription, undefined);
    now += PUSH_SUBSCRIPTION_MAX_AGE_MS;
    expect(push.canReach(HOST)).is.false;
  });

  it('missing texts of a kind fall back to English, an unknown participant is unreachable', async () => {
    push.subscribe(HOST, subscription, texts);
    expect(await push.notify(HOST, 'started', {...room, title: 'Abend'}, 'Bob')).eq('sent');
    expect(sent[0].title).eq('Your game has started');
    expect(await push.notify('nobodynobody000001', 'joined', {...room, title: 'Abend'}, 'Bob')).eq('unreachable');
  });

  it('keeps the latest deliveries for the admin page, newest first, without test messages', async () => {
    push.subscribe(HOST, subscription, texts);
    const named = {...room, title: 'Abend'};
    await push.notify(HOST, 'joined', named, 'Bob');
    now += 1000;
    await push.notify('nobodynobody000001', 'started', named, 'Bob');
    await push.notify(HOST, 'request', named, 'Bob', false);
    const info = push.info();
    expect(info.subscribers).eq(1);
    expect(info.deliveries.map((delivery) => `${delivery.kind} ${delivery.participant} ${delivery.result} ${delivery.roomTitle}`))
      .deep.eq(['started nobody unreachable Abend', 'joined hostho sent Abend']);
  });
});
