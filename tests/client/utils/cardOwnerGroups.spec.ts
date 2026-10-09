import {expect} from 'chai';
import {cardOwnerGroups, CardOwner} from '@/client/utils/cardOwnerGroups';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';

describe('cardOwnerGroups', () => {
  const red: CardOwner = {name: 'Ada', color: 'red'};
  const blue: CardOwner = {name: 'Bo', color: 'blue'};
  const green: CardOwner = {name: 'Cy', color: 'green'};
  const card = (name: CardName) => ({name} as CardModel);
  const owners = new Map<CardName, CardOwner>([
    [CardName.ANTS, blue],
    [CardName.TARDIGRADES, red],
    [CardName.DECOMPOSERS, green],
    [CardName.NITRITE_REDUCING_BACTERIA, blue],
  ]);
  const cards = [CardName.ANTS, CardName.TARDIGRADES, CardName.DECOMPOSERS, CardName.NITRITE_REDUCING_BACTERIA, CardName.REGOLITH_EATERS].map(card);

  it('groups opponents first in turn order, own cards last, unknown owner at the end', () => {
    const groups = cardOwnerGroups(cards, (c) => owners.get(c.name), [red, blue, green], 'red');
    expect(groups.map((group) => group.owner?.name)).deep.eq(['Bo', 'Cy', 'Ada', undefined]);
    expect(groups[0].cards.map((c) => c.name)).deep.eq([CardName.ANTS, CardName.NITRITE_REDUCING_BACTERIA]);
  });

  it('leaves out players without cards', () => {
    const groups = cardOwnerGroups([card(CardName.ANTS)], (c) => owners.get(c.name), [red, blue, green], 'red');
    expect(groups.map((group) => group.owner?.name)).deep.eq(['Bo']);
  });
});
