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

  it('offers a separate "none" button instead of "Save 0" when no card is required', async () => {
    const wrapper = mountWithMin(0);
    const buttons = () => wrapper.findAllComponents({name: 'AppButton'});
    expect(buttons()[0].props('disabled')).to.be.true;
    expect(buttons()[1].props('disabled')).to.be.false;
    await wrapper.setData({cards: [{name: 'Ants'}]});
    expect(buttons()[0].props('disabled')).to.be.false;
    expect(buttons()[1].props('disabled')).to.be.true;
  });

  // Header row: "Select all" on the left, hand sorting on the right
  function mountSelection(max: number, hand: Array<string>, buttonLabel = 'Sell', extraProps: Record<string, unknown> = {}) {
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
        ...extraProps,
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

  // Initial cards: no own confirm button, but still "Select all"
  it('offers select all for the initial cards even without save button', () => {
    const wrapper = mountSelection(3, [], 'Buy', {showsave: false, selectAllAllowed: true});
    expect(wrapper.find('.select-card-toolbar__select-all').exists()).is.true;
  });

  it('hides select all when only some cards may be chosen', () => {
    const wrapper = mountSelection(2, []);
    expect(wrapper.find('.select-card-toolbar__select-all').exists()).is.false;
  });

  it('shows the filter and sort row only for cards from the hand', () => {
    expect(mountSelection(3, ['Ants', 'Birds', 'Cartel']).findComponent({name: 'CardFilterBar'}).exists()).is.true;
    expect(mountSelection(3, ['Ants']).findComponent({name: 'CardFilterBar'}).exists()).is.false;
  });

  it('disables buying and offers discarding when the money is not enough', async () => {
    let saved = false;
    const wrapper = shallowMount(SelectCard, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {
          title: 'You cannot afford any cards',
          buttonLabel: 'Ok',
          type: 'card',
          cards: [{name: 'Industrial Center'}],
          max: 0,
          min: 0,
          showOnlyInLearnerMode: false,
          selectBlueCardAction: false,
          showOwner: false,
          showSelectAll: false,
        },
        onsave: () => {
          saved = true;
        },
        showsave: true,
        showtitle: true,
      },
    } as any);
    expect(wrapper.find('.select-card-unaffordable').exists()).is.true;
    expect(wrapper.find('.cardbox--unaffordable').exists()).is.true;
    const buttons = wrapper.findAllComponents({name: 'AppButton'});
    expect(buttons[0].props('disabled')).is.true;
    expect(buttons[1].props('disabled')).is.not.true;
    (wrapper.vm as any).saveData();
    expect(saved).is.true;
  });

  it('calls the "none" button Discard when buying', () => {
    const wrapper = shallowMount(SelectCard, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {
          title: 'Select card(s) to buy', buttonLabel: 'Buy', type: 'card', cards: [{name: 'Greenhouses'}],
          max: 1, min: 0, showOnlyInLearnerMode: false, selectBlueCardAction: false, showOwner: false, showSelectAll: false,
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    } as any);
    const buttons = wrapper.findAllComponents({name: 'AppButton'});
    expect(buttons[0].props('disabled')).is.true;
    expect(buttons[1].props('title')).eq('Discard');
  });

  it('offers filter and sorting when choosing an action card, the zoom row otherwise', () => {
    const actions = mountSelection(1, []);
    expect(actions.findComponent({name: 'CardZoomBar'}).exists()).is.true;
    const wrapper = shallowMount(SelectCard, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {
          title: 'Perform an action from a played card',
          buttonLabel: 'Take action',
          type: 'card',
          cards: [{name: 'Ants'}],
          max: 1,
          min: 1,
          showOnlyInLearnerMode: false,
          selectBlueCardAction: true,
          showOwner: false,
          showSelectAll: false,
        },
        onsave: () => {},
        showsave: true,
        showtitle: false,
      },
    } as any);
    // Filter of the played cards, without the cost filter
    const bar = wrapper.findComponent({name: 'CardFilterBar'});
    expect(bar.exists()).is.true;
    expect(bar.props('context')).deep.eq({withCost: false});
  });
});
