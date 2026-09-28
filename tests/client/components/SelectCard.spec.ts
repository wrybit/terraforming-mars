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

  // Button gesperrt, solange weniger Karten gewählt sind als nötig
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
    // Erster Button = Hauptbutton ("Alle auswählen" ist hier aus)
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
});
