import {expect} from 'chai';
import {CHAT_KEEP_MS, CHAT_RATE_LIMIT, LobbyChat} from '../../src/server/lobby/LobbyChat';
import {hasForeignLink} from '../../src/server/lobby/chatLinks';
import {maskWords, normalizeChatWords} from '../../src/server/lobby/chatWords';
import {memoryStorage} from '../../src/server/lobby/lobbyStorage';
import {LobbyError} from '../../src/server/lobby/lobbyValidation';

const ME = 'pme0000000000';
const OTHER = 'pother0000000';
const HOST = 'localhost:8123';
const profile = {name: 'Ann', color: 'red', emoji: '🚀'};

describe('LobbyChat', () => {
  let now: number;
  let chat: LobbyChat;

  beforeEach(() => {
    now = 1_000_000_000;
    chat = new LobbyChat(() => now, () => ['arsch', 'fuck'], memoryStorage());
  });

  function refused(action: () => unknown): void {
    expect(action).to.throw(LobbyError);
  }

  it('keeps messages, marks the own ones and masks blocked words', () => {
    chat.post(ME, profile, '  Hallo   Arschloch, fuck!  ', HOST);
    expect(chat.list(ME).messages[0]).to.include({name: 'Ann', text: 'Hallo *********, ****!', you: true});
    expect(chat.list(OTHER).messages[0].you).is.false;
  });

  it('allows links to this server only', () => {
    chat.post(ME, profile, 'Komm in http://localhost:8123/lobby/room/ab12-Spiel', HOST);
    refused(() => chat.post(ME, profile, 'Schau www.example.com', HOST));
    refused(() => chat.post(ME, profile, 'oder spam.ru/x', HOST));
    expect(chat.list(ME).messages).has.length(1);
  });

  it('refuses empty and flooding messages and forgets old ones', () => {
    refused(() => chat.post(ME, profile, '   ', HOST));
    for (let i = 0; i < CHAT_RATE_LIMIT; i++) {
      chat.post(ME, profile, 'hi ' + i, HOST);
    }
    refused(() => chat.post(ME, profile, 'one too many', HOST));
    chat.post(OTHER, profile, 'others may still write', HOST);
    now += CHAT_KEEP_MS + 1;
    expect(chat.list(ME).messages).is.empty;
  });
});

describe('chat filters', () => {
  it('finds foreign links but no ordinary dots', () => {
    expect(hasForeignLink('Hallo.Wie geht es? z.B. so', HOST)).is.false;
    expect(hasForeignLink('https://LOCALHOST:8123/game', HOST)).is.false;
    expect(hasForeignLink('https://evil.example/', HOST)).is.true;
    expect(hasForeignLink('discord.gg/abc', HOST)).is.true;
  });

  it('masks at the start of words only', () => {
    expect(maskWords('Barsch und Arschbombe', ['arsch'])).eq('Barsch und **********');
    expect(normalizeChatWords([' Fuck ', 'fuck', '', 3])).deep.eq(['fuck']);
  });
});
