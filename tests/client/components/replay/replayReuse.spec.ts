import {expect} from 'chai';
import {reuseUnchanged} from '@/client/components/replay/replayReuse';

describe('reuseUnchanged', () => {
  it('keeps unchanged parts as the same objects', () => {
    const previous = {board: [{id: '01', tile: 'city'}, {id: '02'}], player: {mc: 3, tableau: ['A']}};
    const next = {board: [{id: '01', tile: 'city'}, {id: '02', tile: 'ocean'}], player: {mc: 3, tableau: ['A']}};
    const result = reuseUnchanged(previous, next);

    expect(result).deep.eq(next);
    expect(result.player).eq(previous.player);
    expect(result.board[0]).eq(previous.board[0]);
    expect(result.board[1]).not.eq(previous.board[1]);
    expect(result).not.eq(previous);
  });

  it('returns the previous object when nothing changed', () => {
    const previous = {a: [1, 2], b: {c: 'x'}};
    expect(reuseUnchanged(previous, {a: [1, 2], b: {c: 'x'}})).eq(previous);
  });

  it('keeps class instances as instances', () => {
    class Line {
      constructor(public text: string) {}
    }
    const previous = [new Line('a')];
    const result = reuseUnchanged(previous, [new Line('b')]);
    expect(result[0]).instanceOf(Line);
    expect(result[0].text).eq('b');
  });
});
