import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import HandSortControl from '@/client/components/HandSortControl.vue';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CardOrderStorage} from '@/client/utils/CardOrderStorage';
import {handSortOrder, resetHandSort} from '@/client/utils/handSort';
import {FakeLocalStorage} from './FakeLocalStorage';
import {asComplete} from './utils/models';

// Ants: 9, Cartel: 8, Birds: 10
const HAND = [CardName.BIRDS, CardName.ANTS, CardName.CARTEL];

function playerView(): PlayerViewModel {
  return asComplete<PlayerViewModel>({
    id: 'p-1',
    cardsInHand: HAND.map((name) => asComplete<CardModel>({name})),
    preludeCardsInHand: [],
    ceoCardsInHand: [],
  });
}

function handOrder(): Array<string> {
  const order = CardOrderStorage.getCardOrder('p-1');
  return [...HAND].sort((first, second) => order[first] - order[second]);
}

describe('HandSortControl', () => {
  let localStorage: FakeLocalStorage;

  beforeEach(() => {
    localStorage = new FakeLocalStorage();
    FakeLocalStorage.register(localStorage);
    resetHandSort();
    CardOrderStorage.updateCardOrder('p-1', {[CardName.BIRDS]: 1, [CardName.ANTS]: 2, [CardName.CARTEL]: 3});
  });
  afterEach(() => {
    FakeLocalStorage.deregister(localStorage);
  });

  function mountControl(compact = false, allowManual = true) {
    return mount(HandSortControl, {...globalConfig, props: {playerView: playerView(), compact, allowManual}});
  }

  // Opens the sort menu and chooses a sorting: row = Cost, Type, Resource, VP; ↑ ascending, ↓ descending
  async function choose(wrapper: ReturnType<typeof mount>, row: number, reversed: boolean) {
    await wrapper.find('.card-sort__more').trigger('click');
    await wrapper.findAll('.card-sort-menu__row')[row].findAll('button')[reversed ? 1 : 0].trigger('click');
  }

  it('shows manual when no sort is chosen', () => {
    const wrapper = mountControl();
    expect(wrapper.find('.card-sort__manual').classes()).to.include('card-bar-pill--on');
    expect(wrapper.find('.card-sort__more').text()).eq('Sort');
  });

  it('chooses a sort and direction from the menu and sorts the hand', async () => {
    const wrapper = mountControl();
    await choose(wrapper, 0, false);
    expect(handSortOrder()).to.deep.eq({key: 'cost', reversed: false});
    expect(wrapper.find('.card-sort__more').text()).eq('Cost ↑');
    expect(wrapper.find('.card-sort-menu').exists()).is.false;
    expect(handOrder()).to.deep.eq([CardName.CARTEL, CardName.ANTS, CardName.BIRDS]);

    await choose(wrapper, 0, true);
    expect(handSortOrder()).to.deep.eq({key: 'cost', reversed: true});
    expect(wrapper.find('.card-sort__more').text()).eq('Cost ↓');
    expect(handOrder()).to.deep.eq([CardName.BIRDS, CardName.ANTS, CardName.CARTEL]);
  });

  it('manual restores the own order', async () => {
    const wrapper = mountControl();
    await choose(wrapper, 0, false);
    await wrapper.find('.card-sort__manual').trigger('click');
    expect(handSortOrder()).is.undefined;
    expect(handOrder()).to.deep.eq(HAND);
  });

  it('shares the sort between several controls (hand tab and selection dialogs)', async () => {
    const first = mountControl();
    const second = mountControl();
    await choose(first, 3, false);
    expect(second.find('.card-sort__more').text()).to.contain('VP ↑');
  });

  it('narrow row: one icon button, manual inside the menu', async () => {
    const wrapper = mountControl(true);
    expect(wrapper.find('.card-sort__manual').exists()).is.false;
    await choose(wrapper, 0, true);
    expect(handSortOrder()).to.deep.eq({key: 'cost', reversed: true});
    // The button shows what the list is sorted by: icon plus direction
    expect(wrapper.find('.card-sort__more .resource_icon--megacredits').exists()).is.true;
    expect(wrapper.find('.card-sort__more').text()).eq('↓');

    await wrapper.find('.card-sort__more').trigger('click');
    await wrapper.find('.card-sort-menu__manual').trigger('click');
    expect(handSortOrder()).is.undefined;
    expect(handOrder()).to.deep.eq(HAND);
  });

  it('without drag & drop (play, sell): no manual, choosing the active direction again restores the order', async () => {
    const wrapper = mountControl(false, false);
    expect(wrapper.find('.card-sort__manual').exists()).is.false;
    await choose(wrapper, 0, false);
    expect(handSortOrder()).to.deep.eq({key: 'cost', reversed: false});
    await choose(wrapper, 0, false);
    expect(handSortOrder()).is.undefined;
    expect(handOrder()).to.deep.eq(HAND);
  });
});
