import {expect} from 'chai';
import {boardTabInfo, boardTabs, DUNE_BOARD_TABS} from '@/client/components/boardTabs/boardTabs';
import {duneInputComponent} from '@/client/components/dune/duneInputs';
import {WORM_TITLE} from '@/common/dune/duneActionTitles';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {fakeGameModel} from '../testHelpers';
import {OrOptionsModel} from '@/common/models/PlayerInputModel';
import {displayedOptionIndices} from '@/client/components/orOptionsDisplayed';

// RULE (CLAUDE.md "Dune must never break Mars"): the client of a Mars game shows nothing of Dune.
describe('Mars client is unaffected by Dune', () => {
  it('shows no Dune board tabs in a Mars game', () => {
    const tabs = boardTabs(fakeGameModel());
    for (const tab of DUNE_BOARD_TABS) {
      expect(tabs).not.includes(tab);
    }
  });

  it('shows one tab per Dune module of a Dune game, only for the modules in play', () => {
    const game = fakeGameModel({dune: {worm: {spaceId: '48', roll: undefined, direction: undefined, turned: false, path: [], trail: {start: '48', moves: []}, chooser: undefined}}});
    expect(boardTabs(game)).deep.eq(['mars', 'worm']);
  });

  it('keeps every entry of a Mars action menu (only the Dune module group leaves the menu)', () => {
    const titles = ['Play project card', 'Standard projects', 'Fund an award', 'Sell patents', 'Pass for this generation'];
    const menu = {type: 'or', title: 'Take your first action', buttonLabel: 'OK',
      options: titles.map((title) => ({type: 'option', title, buttonLabel: 'OK'}))} as unknown as OrOptionsModel;
    expect(displayedOptionIndices(menu)).deep.eq([0, 1, 2, 3, 4]);
  });

  it('gives the Mars tabs no module info and Mars inputs no Dune picture', () => {
    const game = fakeGameModel();
    for (const tab of boardTabs(game)) {
      expect(boardTabInfo(game, tab)).is.undefined;
    }
    const view = {game} as unknown as PlayerViewModel;
    const worm = {type: 'or', title: WORM_TITLE, buttonLabel: 'OK', options: []} as unknown as OrOptionsModel;
    expect(duneInputComponent(worm, view)).is.undefined;
  });
});
