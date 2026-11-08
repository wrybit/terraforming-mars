import {expect} from 'chai';
import {reuseUnchanged} from '@/client/utils/reuseUnchanged';

describe('reuseUnchanged', () => {
  const key = (entry: {id: string}) => entry.id;

  it('nothing changed: the previous list itself', () => {
    const previous = [{id: 'a', n: 1}, {id: 'b', n: 2}];
    expect(reuseUnchanged(previous, [{id: 'a', n: 1}, {id: 'b', n: 2}], key)).equal(previous);
  });

  it('keeps unchanged entries, takes changed and new ones', () => {
    const previous = [{id: 'a', n: 1}, {id: 'b', n: 2}];
    const next = [{id: 'a', n: 1}, {id: 'b', n: 3}, {id: 'c', n: 4}];
    const merged = reuseUnchanged(previous, next, key);
    expect(merged[0]).equal(previous[0]);
    expect(merged[1]).equal(next[1]);
    expect(merged).has.length(3);
  });
});
