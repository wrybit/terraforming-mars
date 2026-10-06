import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import HandCardsPanel from '@/client/components/HandCardsPanel.vue';
import HandSortControl from '@/client/components/HandSortControl.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import Card from '@/client/components/card/Card.vue';
import PlayedCardsGroups from '@/client/components/PlayedCardsGroups.vue';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {asComplete} from './utils/models';
import {resetHandSort} from '@/client/utils/handSort';
import {handCardFilter, resetCardFilterState, setUnmatchedCards} from '@/client/utils/cardFilterState';
import {Tag} from '@/common/cards/Tag';

function playerView(tableau: Array<CardModel>, hand: Array<CardModel>): PlayerViewModel {
  return asComplete<PlayerViewModel>({
    id: 'p-1',
    thisPlayer: asComplete<PublicPlayerModel>({color: 'blue', tableau, actionsThisGeneration: [], underworldData: {tokens: [], corruption: 0, activeBonus: undefined}}),
    cardsInHand: hand,
    preludeCardsInHand: [],
    ceoCardsInHand: [],
  });
}

function card(name: CardName, resources?: number): CardModel {
  return asComplete<CardModel>({name, resources, calculatedCost: 0});
}

describe('HandCardsPanel', () => {
  it('shows active cards above the hand and the other played cards below, each with a title', () => {
    const wrapper = mount(HandCardsPanel, {
      ...globalConfig,
      props: {playerView: playerView([card(CardName.PETS, 3), card(CardName.ALGAE)], [card(CardName.SOLETTA)])},
    });
    const titles = wrapper.findAll('.hand-cards-panel__title').map((title) => title.text());
    expect(titles).to.have.length(3);
    // Played cards at the very end, without the active card that already sits on top
    const played = wrapper.findComponent(PlayedCardsGroups);
    expect(played.classes()).to.include('hand-cards-panel__cards');
    expect(played.findAllComponents(Card).map((c) => c.props('card').name)).to.deep.eq([CardName.ALGAE]);
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

    // Sort menu: Cost, Type, Resource, Victory points – each ascending/descending
    const sort = wrapper.findComponent(HandSortControl);
    await sort.find('.card-sort__more').trigger('click');
    await sort.findAll('.card-sort-menu__row')[3].findAll('button')[0].trigger('click');

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

  it('the filter hides or dims hand cards but keeps them in the list', async () => {
    resetCardFilterState();
    const wrapper = mount(HandCardsPanel, {
      ...globalConfig,
      props: {playerView: playerView([], [card(CardName.CARTEL), card(CardName.ANTS)])},
    });
    handCardFilter.tags.add(Tag.EARTH);
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.sortable-slot')).to.have.length(2);
    expect(wrapper.findAll('.sortable-slot.card-filter-hidden').map((slot) => slot.attributes('data-card-name'))).to.deep.eq([CardName.ANTS]);

    setUnmatchedCards('dim');
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.sortable-slot.card-filter-dimmed')).to.have.length(1);

    // Nothing left: hint with reset instead of an empty area
    setUnmatchedCards('hide');
    handCardFilter.tags.clear();
    handCardFilter.tags.add(Tag.SPACE);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.card-filter-empty').exists()).is.true;
    resetCardFilterState();
  });

  it('one filter row at the top filters every section and drops emptied ones', async () => {
    resetCardFilterState();
    const wrapper = mount(HandCardsPanel, {
      ...globalConfig,
      props: {playerView: playerView([card(CardName.PETS), card(CardName.ALGAE)], [card(CardName.CARTEL), card(CardName.ANTS)])},
    });
    expect(wrapper.findAll('.card-filter-bar')).to.have.length(1);
    expect(wrapper.find('.hand-cards-panel > .card-filter-bar').exists()).is.true;

    // Plant tag: Algae (played) stays, Pets (active) and both hand cards drop out
    handCardFilter.tags.add(Tag.PLANT);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.hand-cards-panel__section--active').exists()).is.false;
    expect(wrapper.find('.hand-cards-panel__section--hand').exists()).is.false;
    expect(wrapper.findComponent(PlayedCardsGroups).findAllComponents(Card).map((c) => c.props('card').name)).to.deep.eq([CardName.ALGAE]);
    resetCardFilterState();
  });
});
