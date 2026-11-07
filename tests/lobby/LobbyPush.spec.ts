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
    await push.notify(HOST, 'joined', room, 'Bob');
    expect(sent).deep.eq([{title: 'Bob ist da', body: 'Bob ist deinem Spiel beigetreten', url: room.path, tag: 'lobby-ab12'}]);
    expect((storage.data as {vapid: unknown}).vapid).deep.eq({publicKey: 'public', privateKey: 'private'});
  });

  it('refuses odd subscriptions and forgets gone, cancelled and old ones', async () => {
    expect(() => push.subscribe(HOST, {endpoint: 'http://insecure'}, texts)).to.throw(LobbyError);
    push.subscribe(HOST, subscription, texts);
    answer = 'gone';
    await push.notify(HOST, 'joined', room, 'Bob');
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
    expect(await push.notify(HOST, 'started', room, 'Bob')).eq('sent');
    expect(sent[0].title).eq('Your game has started');
    expect(await push.notify('nobodynobody000001', 'joined', room, 'Bob')).eq('unreachable');
  });
});
