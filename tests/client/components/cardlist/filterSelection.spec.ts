import {expect} from 'chai';
import {isMarked, isUnfiltered, markedOptions, resetOptions, toggleOption} from '@/client/components/cardlist/filterSelection';

describe('filterSelection', () => {
  const keys = ['a', 'b', 'c'] as const;
  type Key = typeof keys[number];
  const everything = (): Record<Key, boolean> => ({a: true, b: true, c: true});

  it('treats all included as unfiltered, with nothing marked', () => {
    const selection = everything();
    expect(isUnfiltered(selection, keys)).to.be.true;
    expect(isMarked(selection, keys, 'a')).to.be.false;
    expect(markedOptions(selection, keys)).to.deep.eq([]);
  });

  it('narrows to one option on the first click, then adds and removes', () => {
    const selection = everything();
    toggleOption(selection, keys, 'b');
    expect(selection).to.deep.eq({a: false, b: true, c: false});
    toggleOption(selection, keys, 'c');
    expect(markedOptions(selection, keys)).to.deep.eq(['b', 'c']);
    toggleOption(selection, keys, 'b');
    expect(markedOptions(selection, keys)).to.deep.eq(['c']);
  });

  it('removing the last marked option clears the filter instead of hiding everything', () => {
    const selection = everything();
    toggleOption(selection, keys, 'a');
    toggleOption(selection, keys, 'a');
    expect(isUnfiltered(selection, keys)).to.be.true;
  });

  it('ignores options outside the given keys', () => {
    const selection = {...everything(), hidden: false};
    expect(isUnfiltered(selection, keys)).to.be.true;
    resetOptions(selection, keys);
    expect(selection.hidden).to.be.false;
  });
});
