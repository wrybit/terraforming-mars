import {expect} from 'chai';
import {CardListEntry, FilterState, passesFilters} from '@/client/components/cardlist/cardListEntries';
import {hashToModel, modelToHash} from '@/client/components/cardlist/CardListModel';
import {ClientCard} from '@/common/cards/ClientCard';
import {CardType} from '@/common/cards/CardType';

describe('card list cost range', () => {
  function entry(cost: number | undefined): CardListEntry {
    const card = {name: 'x', type: CardType.AUTOMATED, module: 'base', tags: [], cost} as unknown as ClientCard;
    return {name: 'x', searchKind: 'card', type: CardType.AUTOMATED, module: 'base', card};
  }
  function state(costMin: number | undefined, costMax: number | undefined): FilterState {
    const {types, tags, expansions, resources} = hashToModel('');
    return {types, tags, expansions, resources, vps: 0, costMin, costMax};
  }

  it('keeps cards inside the range and drops the rest', () => {
    expect(passesFilters(entry(10), state(5, 12))).to.be.true;
    expect(passesFilters(entry(4), state(5, 12))).to.be.false;
    expect(passesFilters(entry(13), state(5, 12))).to.be.false;
    expect(passesFilters(entry(13), state(5, undefined))).to.be.true;
  });

  it('hides entries without a price only while a range is set', () => {
    expect(passesFilters(entry(undefined), state(undefined, undefined))).to.be.true;
    expect(passesFilters(entry(undefined), state(undefined, 20))).to.be.false;
  });

  it('keeps the range in the address hash', () => {
    const model = hashToModel('');
    model.costMin = 5;
    model.costMax = 20;
    const restored = hashToModel(modelToHash(model));
    expect([restored.costMin, restored.costMax]).to.deep.eq([5, 20]);
    model.costMin = undefined;
    const openLow = hashToModel(modelToHash(model));
    expect([openLow.costMin, openLow.costMax]).to.deep.eq([undefined, 20]);
  });
});
