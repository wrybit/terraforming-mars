import {expect} from 'chai';
import {keepDraftCardOrder} from '@/client/utils/draftCardOrder';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {asComplete} from '../components/utils/models';

function cards(...names: Array<CardName>): Array<CardModel> {
  return names.map((name) => asComplete<CardModel>({name}));
}

describe('draftCardOrder', () => {
  beforeEach(() => sessionStorage.clear());

  it('keeps the first shown order while the same cards are offered', () => {
    keepDraftCardOrder('p1', cards(CardName.MOSS, CardName.SOLAR_WIND_POWER, CardName.MINING_AREA));
    const repick = keepDraftCardOrder('p1', cards(CardName.SOLAR_WIND_POWER, CardName.MINING_AREA, CardName.MOSS));
    expect(repick.map((card) => card.name)).deep.eq([CardName.MOSS, CardName.SOLAR_WIND_POWER, CardName.MINING_AREA]);
  });

  it('takes the new order for a new set of cards', () => {
    keepDraftCardOrder('p1', cards(CardName.MOSS, CardName.SOLAR_WIND_POWER));
    const next = keepDraftCardOrder('p1', cards(CardName.ALGAE, CardName.MOSS));
    expect(next.map((card) => card.name)).deep.eq([CardName.ALGAE, CardName.MOSS]);
  });
});
