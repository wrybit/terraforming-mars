import {expect} from 'chai';
import {CardName} from '../../../src/common/cards/CardName';
import {FOUND_LIFE_VARIANT_COUNT, foundLifeImage, foundLifeVariant, hasFoundLife} from '../../../src/common/cards/foundLife';

describe('foundLife', () => {
  it('only Search For Life with a science resource has found life', () => {
    expect(hasFoundLife(CardName.SEARCH_FOR_LIFE, 1)).is.true;
    expect(hasFoundLife(CardName.SEARCH_FOR_LIFE, 0)).is.false;
    expect(hasFoundLife(CardName.SEARCH_FOR_LIFE, undefined)).is.false;
    expect(hasFoundLife(CardName.BIRDS, 1)).is.false;
  });

  it('picks a stable microbe within the available pictures', () => {
    const variants = new Set<number>();
    for (let index = 0; index < 200; index++) {
      const variant = foundLifeVariant('game' + index + 'red');
      expect(variant).to.be.within(0, FOUND_LIFE_VARIANT_COUNT - 1);
      variants.add(variant);
    }
    expect(variants.size).to.eq(FOUND_LIFE_VARIANT_COUNT);
    expect(foundLifeVariant('g1red')).to.eq(foundLifeVariant('g1red'));
    expect(foundLifeImage(0)).to.eq('assets/search-for-life/microbe-01.webp');
    expect(foundLifeImage(11)).to.eq('assets/search-for-life/microbe-12.webp');
  });
});
