import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import HandCardsPanel from '@/client/components/HandCardsPanel.vue';
import HandSortControl from '@/client/components/HandSortControl.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {asComplete} from './utils/models';
import {resetHandSort} from '@/client/utils/handSort';

function playerView(tableau: Array<CardModel>, hand: Array<CardModel>): PlayerViewModel {
  return asComplete<PlayerViewModel>({
    id: 'p-1',
    thisPlayer: asComplete<PublicPlayerModel>({color: 'blue', tableau, actionsThisGeneration: []}),
    cardsInHand: hand,
    preludeCardsInHand: [],
    ceoCardsInHand: [],
  });
}

function card(name: CardName, resources?: number): CardModel {
  return asComplete<CardModel>({name, resources, calculatedCost: 0});
}

describe('HandCardsPanel', () => {
  it('shows active cards above the hand with both titles', () => {
    const wrapper = mount(HandCardsPanel, {
      ...globalConfig,
      props: {playerView: playerView([card(CardName.PETS, 3), card(CardName.ALGAE)], [card(CardName.SOLETTA)])},
    });
    const titles = wrapper.findAll('.hand-cards-panel__title').map((title) => title.text());
    expect(titles).to.have.length(2);
    // Only the blue card (Pets) ends up on top, Algae (green) doesn't
    const active = wrapper.find('.hand-cards-panel__section--active');
    expect(active.findAllComponents({name: 'Card'})).to.have.length(1);
    // The card's counter is visible live
    expect(active.find('.card-resources-counter-number').text()).eq('3');
  });

  it('omits titles when there are no active cards', () => {
    const wrapper = mount(HandCardsPanel, {
      ...globalConfig,
      props: {playerView: playerView([], [card(CardName.SOLETTA)])},
    });
    expect(wrapper.findAll('.hand-cards-panel__title')).to.have.length(0);
    expect(wrapper.findAllComponents({name: 'SortableCards'})).to.have.length(1);
  });

  // Moved here from upstream (PlayerHome.spec): in the fork the hand cards live in HandCardsPanel.
  it('sort buttons sort the hand', async () => {
    resetHandSort();
    const wrapper = mount(HandCardsPanel, {
      ...globalConfig,
      props: {playerView: playerView([], [card(CardName.CARTEL), card(CardName.ASTEROID_MINING)])},
    });

    // Segments: Manual, Cost, Type, Resource, Victory points
    await wrapper.findComponent(HandSortControl).findAll('button')[4].trigger('click');

    const names = wrapper.findComponent(SortableCards).findAllComponents({name: 'Card'}).map((c) => c.props('card').name);
    expect(names).to.deep.eq([CardName.ASTEROID_MINING, CardName.CARTEL]);
  });

  it('hides sort buttons for a single hand card', () => {
    const wrapper = mount(HandCardsPanel, {
      ...globalConfig,
      props: {playerView: playerView([], [card(CardName.SOLETTA)])},
    });
    expect(wrapper.findComponent(HandSortControl).exists()).is.false;
  });
});
