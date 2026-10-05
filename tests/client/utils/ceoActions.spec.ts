import {expect} from 'chai';
import {CardName} from '@/common/cards/CardName';
import {SelectCardModel} from '@/common/models/PlayerInputModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {ceoCardState, isCeoActionOption, ownCeoCards} from '@/client/utils/ceoActions';

const ceoOption = {
  type: 'card',
  title: 'Use CEO once per game action',
  buttonLabel: 'Take action',
  cards: [{name: CardName.FLOYD}],
  min: 1,
  max: 1,
} as unknown as SelectCardModel;

describe('ceoActions', () => {
  it('finds the CEO cards in the tableau', () => {
    const player = {tableau: [{name: CardName.FLOYD}, {name: CardName.ALGAE}]} as unknown as PublicPlayerModel;
    expect(ownCeoCards(player).map((card) => card.name)).deep.eq([CardName.FLOYD]);
  });

  it('recognizes the CEO action option', () => {
    expect(isCeoActionOption(ceoOption)).to.be.true;
    expect(isCeoActionOption({...ceoOption, title: 'Perform an action from a played card'})).to.be.false;
  });

  it('tells available, unavailable and used CEOs apart', () => {
    expect(ceoCardState({name: CardName.FLOYD}, ceoOption)).eq('available');
    expect(ceoCardState({name: CardName.FLOYD}, undefined)).eq('unavailable');
    expect(ceoCardState({name: CardName.FLOYD, isDisabled: true}, undefined)).eq('used');
  });
});
