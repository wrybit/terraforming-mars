import {expect} from 'chai';
import {chatTextParts} from '@/client/components/lobby/lobbyChatApi';

const ORIGIN = 'https://tm.example';

describe('chatTextParts', () => {
  it('marks hashtags at the start or after white space', () => {
    expect(chatTextParts('#looking-for-game Wer spielt? #2-players', ORIGIN)).deep.eq([
      {text: '#looking-for-game', tag: true},
      {text: ' Wer spielt? '},
      {text: '#2-players', tag: true},
    ]);
  });

  it('leaves # inside words and links alone', () => {
    expect(chatTextParts('C#Fan sieh https://tm.example/lobby#top', ORIGIN)).deep.eq([
      {text: 'C#Fan sieh '},
      {text: 'https://tm.example/lobby#top', href: 'https://tm.example/lobby#top'},
    ]);
  });
});
