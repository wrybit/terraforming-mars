import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import BoardTabs from '@/client/components/boardTabs/BoardTabs.vue';
import {boardTabState, selectBoardTab} from '@/client/components/boardTabs/boardTabState';
import {boardTabs, boardTabTracks} from '@/client/components/boardTabs/boardTabs';
import {fakeGameModel} from '../testHelpers';

const moonModel = {habitatRate: 2, miningRate: 0, logisticRate: 7, spaces: []};

describe('BoardTabs', () => {
  afterEach(() => selectBoardTab('mars'));

  it('shows no tab bar without expansion boards', () => {
    const wrapper = mount(BoardTabs, {...globalConfig, props: {game: fakeGameModel(), players: [], tileView: 'show'}, slots: {mars: '<div class="fake-mars"></div>'}});
    expect(wrapper.find('.board-tabs-bar').exists()).is.false;
    expect(wrapper.find('.fake-mars').exists()).is.true;
    expect(wrapper.find('.board-tabs-panel--single').exists()).is.true;
  });

  it('adds one tab per expansion board and switches the shared state', async () => {
    const game = fakeGameModel({moon: moonModel});
    const wrapper = mount(BoardTabs, {...globalConfig, props: {game, players: [], tileView: 'show'},
      slots: {mars: '<div class="fake-mars"></div>', moon: '<div class="fake-moon"></div>'}});
    const tabs = wrapper.findAll('.board-tab');
    expect(tabs.map((tab) => tab.attributes('data-test'))).deep.eq(['board-tab-mars', 'board-tab-moon']);
    await tabs[1].trigger('click');
    expect(boardTabState.active).eq('moon');
    // Mars keeps its place (box height), the moon view lies on top
    expect(wrapper.find('.board-tabs-mars--covered').exists()).is.true;
    expect(wrapper.find('.board-tabs-panel--moon').exists()).is.true;
  });

  it('falls back to Mars when the open board is not part of the game', () => {
    selectBoardTab('turmoil');
    const wrapper = mount(BoardTabs, {...globalConfig, props: {game: fakeGameModel(), players: [], tileView: 'show'}});
    expect(wrapper.find('.board-tabs-panel--mars').exists()).is.true;
  });

  it('lists boards and their short info tracks', () => {
    const game = fakeGameModel({moon: moonModel});
    expect(boardTabs(game)).deep.eq(['mars', 'moon']);
    const moon = boardTabTracks(game, [], 'moon');
    expect(moon.map((track) => track.step)).deep.eq([2, 7, 0]);
    expect(boardTabTracks(game, [], 'mars')[0].total).eq(19);
  });
});
