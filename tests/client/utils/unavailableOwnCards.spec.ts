import {expect} from 'chai';
import {CardName} from '@/common/cards/CardName';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {unavailableOwnCards} from '@/client/utils/unavailableOwnCards';

function view(options: Array<unknown>): PlayerViewModel {
  return {
    cardsInHand: [{name: CardName.ANTS}, {name: CardName.BIRDS}],
    thisPlayer: {tableau: [{name: CardName.TARDIGRADES}, {name: CardName.AI_CENTRAL}], actionsThisGeneration: []},
    waitingFor: {type: 'or', title: 'Take your first action', options},
  } as unknown as PlayerViewModel;
}

describe('unavailableOwnCards', () => {
  it('lists hand cards not offered and action cards not usable during the action menu', () => {
    const names = unavailableOwnCards(view([
      {type: 'projectCard', title: 'Play project card', cards: [{name: CardName.ANTS}]},
      {type: 'card', title: 'Perform an action from a played card', cards: [{name: CardName.TARDIGRADES}]},
      {type: 'option', title: 'Pass for this generation'},
    ]));
    expect(names !== undefined ? [...names] : undefined).to.have.members([CardName.BIRDS, CardName.AI_CENTRAL]);
  });

  it('knows nothing outside the action menu', () => {
    const playerView = {...view([]), waitingFor: undefined} as unknown as PlayerViewModel;
    expect(unavailableOwnCards(playerView)).is.undefined;
  });
});
