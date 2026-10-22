import {expect} from 'chai';
import {CardResource} from '@/common/CardResource';
import {hashToModel, modelToHash} from '@/client/components/cardlist/CardListModel';

describe('CardListModel', () => {
  it('keeps the more filters in the address hash', () => {
    const model = hashToModel('');
    model.resources[CardResource.ANIMAL] = false;
    model.resources.none = false;
    model.vps = 1;
    model.asteriskRules = 2;
    model.tallCards = true;
    const restored = hashToModel(modelToHash(model));
    expect(restored.resources).deep.eq(model.resources);
    expect(restored.vps).eq(1);
    expect(restored.asteriskRules).eq(2);
    expect(restored.tallCards).is.true;
  });

  it('reads older addresses without them as unfiltered', () => {
    const model = hashToModel('#algae~g0~d1');
    expect(Object.values(model.resources).every((included) => included)).is.true;
    expect(model.vps).eq(0);
    expect(model.asteriskRules).eq(0);
    expect(model.tallCards).is.false;
    expect(model.filterText).eq('algae');
    expect(model.sortOrder).eq('1');
  });

  it('writes nothing for filters that are not set', () => {
    expect(decodeURIComponent(modelToHash(hashToModel('', 'dune')))).not.match(/~[rva]/);
  });
});
