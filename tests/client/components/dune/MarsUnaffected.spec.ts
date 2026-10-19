import {expect} from 'chai';
import {boardTabs, DUNE_BOARD_TABS} from '@/client/components/boardTabs/boardTabs';
import {fakeGameModel} from '../testHelpers';

// RULE (CLAUDE.md "Dune must never break Mars"): the client of a Mars game shows nothing of Dune.
describe('Mars client is unaffected by Dune', () => {
  it('shows no Dune board tabs in a Mars game', () => {
    const tabs = boardTabs(fakeGameModel());
    for (const tab of DUNE_BOARD_TABS) {
      expect(tabs).not.includes(tab);
    }
  });

  it('shows one tab per Dune module of a Dune game, only for the modules in play', () => {
    const game = fakeGameModel({dune: {worm: {spaceId: '48', roll: undefined, direction: undefined, turned: false, path: [], chooser: undefined}}});
    expect(boardTabs(game)).deep.eq(['mars', 'worm']);
  });
});
