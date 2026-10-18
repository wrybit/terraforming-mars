import {expect} from 'chai';
import {splitAsteriskNote} from '@/client/cards/splitAsteriskNote';

describe('splitAsteriskNote', () => {
  it('returns plain texts unchanged', () => {
    expect(splitAsteriskNote('Place an ocean tile.')).deep.eq({main: 'Place an ocean tile.', note: undefined});
  });

  it('splits main text and note with emphasis', () => {
    expect(splitAsteriskNote('Raise oxygen 1 step.<note>Place a tile <b>next to no other tile</b>.</note>')).deep.eq({
      main: 'Raise oxygen 1 step.',
      note: [
        {text: 'Place a tile ', emphasis: false},
        {text: 'next to no other tile', emphasis: true},
        {text: '.', emphasis: false},
      ],
    });
  });

  it('allows a note without main text and emphasis at the start', () => {
    expect(splitAsteriskNote('<note><b>A</b> b</note>')).deep.eq({
      main: '',
      note: [{text: 'A', emphasis: true}, {text: ' b', emphasis: false}],
    });
  });

  it('drops stray tags instead of showing them', () => {
    expect(splitAsteriskNote('A <i>B</i>.').main).eq('A B.');
  });
});
