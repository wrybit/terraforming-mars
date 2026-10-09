import {expect} from 'chai';
import {CardName} from '@/common/cards/CardName';
import {SelectCardModel} from '@/common/models/PlayerInputModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {inactiveActionCards} from '@/client/utils/inactiveActionCards';

const actionsOption = {
  type: 'card',
  title: 'Perform an action from a played card',
  cards: [{name: CardName.AI_CENTRAL}],
} as unknown as SelectCardModel;

describe('inactiveActionCards', () => {
  it('splits the own action cards the tab does not offer into used and not usable', () => {
    const player = {
      tableau: [
        {name: CardName.AI_CENTRAL},
        {name: CardName.BIRDS},
        {name: CardName.TARDIGRADES},
        // No action: never listed
        {name: CardName.ALGAE},
        {name: CardName.FLOYD},
        {name: CardName.KAREN, isDisabled: true},
      ],
      actionsThisGeneration: [CardName.BIRDS],
    } as unknown as PublicPlayerModel;
    const result = inactiveActionCards(player, actionsOption, undefined);
    expect(result.used.map((card) => card.name)).to.have.members([CardName.BIRDS, CardName.KAREN]);
    expect(result.unusable.map((card) => card.name)).to.have.members([CardName.TARDIGRADES, CardName.FLOYD]);
  });
});
