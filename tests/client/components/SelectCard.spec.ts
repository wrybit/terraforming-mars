import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SelectCard from '@/client/components/SelectCard.vue';
import {fakePlayerViewModel} from './testHelpers';

describe('SelectCard', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(SelectCard, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {
          title: 'Select a card',
          buttonLabel: 'Save',
          type: 'card',
          cards: [],
          max: 1,
          min: 1,
          showOnlyInLearnerMode: false,
          selectBlueCardAction: false,
          showOwner: false,
          showSelectAll: false,
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  // Button disabled while fewer cards are selected than required
  function mountWithMin(min: number) {
    return shallowMount(SelectCard, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {
          title: 'Select a card',
          buttonLabel: 'Save',
          type: 'card',
          cards: [{name: 'Ants'}, {name: 'Birds'}],
          max: 1,
          min,
          showOnlyInLearnerMode: false,
          selectBlueCardAction: false,
          showOwner: false,
          showSelectAll: false,
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    } as any);
  }

  it('disables the save button until the required card is selected', async () => {
    const wrapper = mountWithMin(1);
    // First button = main button ("Select all" is off here)
    const saveButton = () => wrapper.findAllComponents({name: 'AppButton'})[0];
    expect(saveButton().props('disabled')).to.be.true;
    await wrapper.setData({cards: {name: 'Ants'}});
    expect(saveButton().props('disabled')).to.be.false;
  });

  it('keeps the save button enabled when no card is required', () => {
    const wrapper = mountWithMin(0);
    const saveButton = wrapper.findAllComponents({name: 'AppButton'})[0];
    expect(saveButton.props('disabled')).to.be.false;
  });

  // Header row: "Select all" on the left, hand sorting on the right
  function mountSelection(max: number, hand: Array<string>, buttonLabel = 'Sell') {
    const cards = [{name: 'Ants'}, {name: 'Birds'}, {name: 'Cartel'}];
    return shallowMount(SelectCard, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel({cardsInHand: hand.map((name) => ({name})) as any}),
        playerinput: {
          title: 'Sell patents',
          buttonLabel,
          type: 'card',
          cards,
          max,
          min: 0,
          showOnlyInLearnerMode: false,
          selectBlueCardAction: false,
          showOwner: false,
          showSelectAll: false,
        },
        onsave: () => {},
        showsave: true,
        showtitle: false,
      },
    } as any);
  }

  it('offers select all when every card may be chosen, and selects them all', async () => {
    const wrapper = mountSelection(3, []);
    const selectAll = wrapper.findComponent('.select-card-toolbar__select-all' as any);
    expect(selectAll.exists()).is.true;
    selectAll.vm.$emit('click');
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).cards).to.have.length(3);
  });

  it('never offers select all when buying cards', () => {
    const wrapper = mountSelection(3, [], 'Buy');
    expect(wrapper.find('.select-card-toolbar__select-all').exists()).is.false;
  });

  it('hides select all when only some cards may be chosen', () => {
    const wrapper = mountSelection(2, []);
    expect(wrapper.find('.select-card-toolbar__select-all').exists()).is.false;
  });

  it('shows the hand sort only for cards from the hand', () => {
    expect(mountSelection(3, ['Ants', 'Birds', 'Cartel']).findComponent({name: 'HandSortControl'}).exists()).is.true;
    expect(mountSelection(3, ['Ants']).findComponent({name: 'HandSortControl'}).exists()).is.false;
  });
});
