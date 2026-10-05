import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {computed} from 'vue';
import {globalConfig} from '../getLocalVue';
import GameMenu from '@/client/components/gameMenu/GameMenu.vue';
import {GAME_MENU_CONTEXT, GameMenuContext} from '@/client/components/gameMenu/gameMenuContext';
import {fakeGameOptionsModel} from '../testHelpers';
import {FakeLocalStorage} from '../FakeLocalStorage';

function context(): GameMenuContext {
  return {
    playerName: 'Alice',
    playerColor: 'blue',
    deckSize: 530,
    discardPileSize: 52,
    coloniesCount: 0,
    gameOptions: fakeGameOptionsModel(),
    playerNumber: 2,
    lastSoloGeneration: 14,
    otherDeckSizes: {corporations: {drawPile: 0, discardPile: 0}, preludes: undefined, ceos: undefined, globalEvents: undefined},
  };
}

describe('GameMenu', () => {
  let localStorage: FakeLocalStorage;

  beforeEach(() => {
    localStorage = new FakeLocalStorage();
    FakeLocalStorage.register(localStorage);
  });

  afterEach(() => {
    FakeLocalStorage.deregister(localStorage);
  });

  it('outside the game only offers language, help and settings', async () => {
    const wrapper = mount(GameMenu, {...globalConfig, attachTo: document.body});
    expect(wrapper.find('.game-menu-button').text()).contains('Setup');
    await wrapper.find('.game-menu-button').trigger('click');
    const dropdown = document.body.querySelector('.game-menu-dropdown');
    expect(dropdown?.querySelector('.game-menu-player')).is.null;
    expect(dropdown?.querySelectorAll('.game-menu-item').length).eq(3);
    wrapper.unmount();
  });

  it('opens the dropdown with player and piles', async () => {
    const wrapper = mount(GameMenu, {
      ...globalConfig,
      global: {...globalConfig.global, provide: {[GAME_MENU_CONTEXT as symbol]: computed(context)}},
      attachTo: document.body,
    });
    await wrapper.find('.game-menu-button').trigger('click');
    const dropdown = document.body.querySelector('.game-menu-dropdown');
    expect(dropdown).is.not.null;
    expect(dropdown?.querySelector('.game-menu-player-name')?.textContent).eq('Alice');
    expect(dropdown?.textContent).contains('530');
    expect(dropdown?.textContent).contains('52');
    wrapper.unmount();
  });
});
