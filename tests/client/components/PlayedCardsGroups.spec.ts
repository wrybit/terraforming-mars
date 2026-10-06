import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import Card from '@/client/components/card/Card.vue';
import PlayedCardsGroups from '@/client/components/PlayedCardsGroups.vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {asComplete} from './utils/models';

function player(tableau: Array<CardModel>): PublicPlayerModel {
  return asComplete<PublicPlayerModel>({color: 'blue', tableau, actionsThisGeneration: []});
}

function card(name: CardName): CardModel {
  return asComplete<CardModel>({name});
}

function shownNames(wrapper: ReturnType<typeof mount>): Array<CardName> {
  return wrapper.findAllComponents(Card).map((c) => c.props('card').name);
}

describe('PlayedCardsGroups', () => {
  const tableau = [card(CardName.PETS), card(CardName.ALGAE), card(CardName.COMET)];

  it('shows all played cards by default', () => {
    const wrapper = mount(PlayedCardsGroups, {...globalConfig, props: {player: player(tableau)}});
    expect(shownNames(wrapper)).to.have.members([CardName.PETS, CardName.ALGAE, CardName.COMET]);
  });

  it('leaves out the active cards on request', () => {
    const wrapper = mount(PlayedCardsGroups, {...globalConfig, props: {player: player(tableau), withoutActiveCards: true}});
    expect(shownNames(wrapper)).to.have.members([CardName.ALGAE, CardName.COMET]);
  });
});
