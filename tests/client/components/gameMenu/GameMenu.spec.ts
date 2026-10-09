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
    // The menu hides the link to the current page, so start from a neutral URL
    window.history.replaceState(null, '', '/');
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
    expect(dropdown?.querySelectorAll('.game-menu-panel:first-child .game-menu-item').length).eq(3);
    wrapper.unmount();
  });

  it('dims the page while open', async () => {
    const wrapper = mount(GameMenu, {...globalConfig, attachTo: document.body});
    expect(document.body.querySelector('.game-menu-backdrop')).is.null;
    await wrapper.find('.game-menu-button').trigger('click');
    expect(document.body.querySelector('.game-menu-backdrop')).is.not.null;
    wrapper.unmount();
  });

  it('lists the main pages in a second box, each in a new tab', async () => {
    const wrapper = mount(GameMenu, {...globalConfig, attachTo: document.body});
    await wrapper.find('.game-menu-button').trigger('click');
    const links = document.body.querySelectorAll<HTMLAnchorElement>('nav.game-menu-panel a.game-menu-item');
    expect(Array.from(links).map((link) => link.getAttribute('href'))).deep.eq(['new-game', 'stats', 'cards',
      'https://github.com/terraforming-mars/terraforming-mars/wiki/Rulebooks', 'https://boardgamegeek.com/boardgame/167791/terraforming-mars']);
    expect(Array.from(links).every((link) => link.target === '_blank')).is.true;
    wrapper.unmount();
  });

  it('always shows the fan project notice, also without navigation and in the game', async () => {
    for (const props of [{navigation: true}, {navigation: false}]) {
      const wrapper = mount(GameMenu, {...globalConfig, props, attachTo: document.body});
      await wrapper.find('.game-menu-button').trigger('click');
      const notice = document.body.querySelector('.game-menu-dropdown .fan-project-notice');
      expect(notice?.textContent).contains('Unofficial fan project');
      expect(notice?.textContent).contains('Not affiliated with FryxGames');
      wrapper.unmount();
    }
    const wrapper = mount(GameMenu, {...globalConfig, global: {...globalConfig.global, provide: {[GAME_MENU_CONTEXT as symbol]: computed(context)}}, attachTo: document.body});
    await wrapper.find('.game-menu-button').trigger('click');
    expect(document.body.querySelector('.game-menu-dropdown .fan-project-notice')).is.not.null;
    wrapper.unmount();
  });

  it('hides the navigation box when switched off (start page)', async () => {
    const wrapper = mount(GameMenu, {...globalConfig, props: {navigation: false}, attachTo: document.body});
    await wrapper.find('.game-menu-button').trigger('click');
    expect(document.body.querySelector('nav.game-menu-panel')).is.null;
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
