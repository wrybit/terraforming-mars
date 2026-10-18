import {expect} from 'chai';
import {parseCardTextMarkup} from '@/client/cards/parseCardTextMarkup';

describe('parseCardTextMarkup', () => {
  it('returns plain texts as one segment', () => {
    expect(parseCardTextMarkup('Place an ocean tile.')).deep.eq({main: [{text: 'Place an ocean tile.', style: 'plain'}], note: undefined});
  });

  it('splits main text and note with the rule words', () => {
    expect(parseCardTextMarkup('Raise oxygen 1 step.<note>Place a tile <b>next to no other tile</b>.</note>')).deep.eq({
      main: [{text: 'Raise oxygen 1 step.', style: 'plain'}],
      note: [
        {text: 'Place a tile ', style: 'plain'},
        {text: 'next to no other tile', style: 'rule'},
        {text: '.', style: 'plain'},
      ],
    });
  });

  it('marks the opponent words in main text and note', () => {
    expect(parseCardTextMarkup('Remove 3 plants <opp>from any player</opp>.<note><b>A</b> <opp>B</opp></note>')).deep.eq({
      main: [{text: 'Remove 3 plants ', style: 'plain'}, {text: 'from any player', style: 'opponent'}, {text: '.', style: 'plain'}],
      note: [{text: 'A', style: 'rule'}, {text: ' ', style: 'plain'}, {text: 'B', style: 'opponent'}],
    });
  });

  it('allows a note without main text', () => {
    expect(parseCardTextMarkup('<note><b>A</b> b</note>').main).deep.eq([]);
  });

  it('drops stray tags instead of showing them', () => {
    expect(parseCardTextMarkup('A <i>B</i>.').main).deep.eq([{text: 'A B.', style: 'plain'}]);
  });
});
