import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import InfoPanel from '@/client/components/InfoPanel.vue';
import {fakeGameOptionsModel} from './testHelpers';

// DialogFrame echt rendern, sonst fehlen bei shallowMount die Inhalte seiner Slots
const withDialogFrame = {global: {...globalConfig.global, stubs: {...globalConfig.global.stubs, DialogFrame: false}}};

describe('InfoPanel', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(InfoPanel, {
      ...withDialogFrame,
      props: {
        gameOptions: fakeGameOptionsModel(),
        playerNumber: 2,
        lastSoloGeneration: 14,
        deckSize: 0,
        discardPileSize: 0,
        otherDeckSizes: {corporations: {drawPile: 0, discardPile: 0}, preludes: undefined, ceos: undefined, globalEvents: undefined},
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows only the decks in the game', () => {
    const wrapper = shallowMount(InfoPanel, {
      ...withDialogFrame,
      props: {
        gameOptions: fakeGameOptionsModel(),
        playerNumber: 2,
        lastSoloGeneration: 14,
        deckSize: 150,
        discardPileSize: 12,
        otherDeckSizes: {
          corporations: {drawPile: 20, discardPile: 4},
          preludes: undefined,
          ceos: {drawPile: 7, discardPile: 1},
          globalEvents: undefined,
        },
      },
    });
    const rows = wrapper.findAll('.setup-tiles--decks .setup-tile').map((tile) => tile.text().replace(/\s+/g, ' '));
    expect(rows).deep.eq(['Projects 150 12', 'Corporations 20 4', 'CEOs 7 1']);
  });
});

describe('InfoPanel spectator link', () => {
  it('shows the full spectator address', () => {
    const wrapper = shallowMount(InfoPanel, {
      ...withDialogFrame,
      props: {
        gameOptions: fakeGameOptionsModel(),
        playerNumber: 2,
        lastSoloGeneration: 14,
        deckSize: 0,
        discardPileSize: 0,
        otherDeckSizes: {corporations: {drawPile: 0, discardPile: 0}, preludes: undefined, ceos: undefined, globalEvents: undefined},
        spectatorId: 'sabc',
      },
    });
    expect(wrapper.find('.info-panel-link-field').text()).eq(window.location.origin + '/spectator?id=sabc');
  });
});
