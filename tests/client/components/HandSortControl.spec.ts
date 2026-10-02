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

  function mountControl() {
    return mount(HandSortControl, {...globalConfig, props: {playerView: playerView()}});
  }

  function selectedLabel(wrapper: ReturnType<typeof mount>): string {
    return wrapper.find('.create-game-segmented--selected').text();
  }

  it('shows manual when no sort is chosen', () => {
    expect(selectedLabel(mountControl())).eq('Manual');
  });

  it('chooses a sort, sorts the hand and flips it on a second tap', async () => {
    const wrapper = mountControl();
    await wrapper.findAll('button')[1].trigger('click');
    expect(handSortOrder()).to.deep.eq({key: 'cost', reversed: false});
    expect(selectedLabel(wrapper)).eq('Cost');
    expect(handOrder()).to.deep.eq([CardName.CARTEL, CardName.ANTS, CardName.BIRDS]);

    await wrapper.findAll('button')[1].trigger('click');
    expect(handSortOrder()).to.deep.eq({key: 'cost', reversed: true});
    expect(wrapper.find('.hand-sort-control--reversed').exists()).is.true;
    expect(handOrder()).to.deep.eq([CardName.BIRDS, CardName.ANTS, CardName.CARTEL]);
  });

  it('manual restores the own order', async () => {
    const wrapper = mountControl();
    await wrapper.findAll('button')[1].trigger('click');
    await wrapper.findAll('button')[0].trigger('click');
    expect(handSortOrder()).is.undefined;
    expect(handOrder()).to.deep.eq(HAND);
  });

  it('shares the sort between several controls (hand tab and selection dialogs)', async () => {
    const first = mountControl();
    const second = mountControl();
    await first.findAll('button')[4].trigger('click');
    expect(selectedLabel(second)).eq('VP');
  });
});
