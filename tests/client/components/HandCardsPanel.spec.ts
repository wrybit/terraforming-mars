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
    // Nur die blaue Karte (Pets) landet oben, Algae (grün) nicht
    const active = wrapper.find('.hand-cards-panel__section--active');
    expect(active.findAllComponents({name: 'Card'})).to.have.length(1);
    // Zähler der Karte ist live sichtbar
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

  // Aus Upstream (PlayerHome.spec) hierher verschoben: die Handkarten liegen im Fork in HandCardsPanel.
  it('sort buttons sort the hand', async () => {
    const wrapper = mount(HandCardsPanel, {
      ...globalConfig,
      props: {playerView: playerView([], [card(CardName.SOLETTA), card(CardName.ALGAE)])},
    });

    wrapper.findComponent(HandSortControl).vm.$emit('update:sortOrder', {key: 'vp', reversed: false});
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(SortableCards).props('sortOrder')).to.deep.eq({key: 'vp', reversed: false});
  });

  it('hides sort buttons for a single hand card', () => {
    const wrapper = mount(HandCardsPanel, {
      ...globalConfig,
      props: {playerView: playerView([], [card(CardName.SOLETTA)])},
    });
    expect(wrapper.findComponent(HandSortControl).exists()).is.false;
  });
});
