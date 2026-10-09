import {expect} from 'chai';
import {defaultCreateGameModel} from '@/client/components/create/defaultCreateGameModel';
import {cardPoolChanged, expansionOptionsChanged, milestonesChanged} from '@/client/components/create/changedFromDefault';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';

describe('changedFromDefault', () => {
  it('default settings are unchanged', () => {
    const model = defaultCreateGameModel();
    expect(expansionOptionsChanged(model)).is.false;
    expect(milestonesChanged(model)).is.false;
    expect(cardPoolChanged(model)).is.false;
  });

  it('expansion options only count while their expansion is on', () => {
    const model = defaultCreateGameModel();
    model.aresExtremeVariant = true;
    expect(expansionOptionsChanged(model)).is.false;
    model.expansions.ares = true;
    expect(expansionOptionsChanged(model)).is.true;
  });

  it('milestones and card pool', () => {
    const model = defaultCreateGameModel();
    model.randomMA = RandomMAOptionType.LIMITED;
    model.bannedCards = ['Algae' as any];
    expect(milestonesChanged(model)).is.true;
    expect(cardPoolChanged(model)).is.true;
  });
});
