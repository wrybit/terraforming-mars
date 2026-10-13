import {expect} from 'chai';
import {
  GAME_END_SPLIT, PLAYER_HOME_SPLIT, labelOffsetY, shareLabel, applyShare, loadShare, setShare, shareFromPointer,
} from '@/client/utils/columnResize';

describe('columnResize', () => {
  const split = PLAYER_HOME_SPLIT;
  beforeEach(() => {
    localStorage.removeItem(PLAYER_HOME_SPLIT.storageKey);
    localStorage.removeItem(GAME_END_SPLIT.storageKey);
  });

  it('computes the right share from the pointer position and keeps it within bounds', () => {
    const container = {left: 0, width: 2000};
    expect(shareFromPointer(split, container, 1200)).to.eq(40);
    expect(shareFromPointer(split, container, 1900)).to.eq(split.minShare);
    expect(shareFromPointer(split, container, 100)).to.eq(split.maxShare);
  });

  it('defaults to 40 % and remembers a chosen share', () => {
    expect(loadShare(split)).to.eq(40);
    const container = document.createElement('div');
    setShare(container, split, 42);
    expect(loadShare(split)).to.eq(42);
    expect(container.style.getPropertyValue('--player-home-board-share')).to.eq('42fr');
    expect(container.style.getPropertyValue('--player-home-main-share')).to.eq('58fr');
  });

  it('forgets the share when reset to the default', () => {
    const container = document.createElement('div');
    setShare(container, split, 50);
    setShare(container, split, split.defaultShare);
    applyShare(container, split, loadShare(split));
    expect(localStorage.getItem(split.storageKey)).to.be.null;
  });

  it('keeps the splits of the game view and the results page apart', () => {
    const container = document.createElement('div');
    setShare(container, GAME_END_SPLIT, 60);
    expect(loadShare(GAME_END_SPLIT)).to.eq(60);
    expect(loadShare(PLAYER_HOME_SPLIT)).to.eq(PLAYER_HOME_SPLIT.defaultShare);
    expect(container.style.getPropertyValue('--game-end-side-share')).to.eq('60fr');
  });

  it('shows the share label below the pointer, or above it near the bottom', () => {
    expect(labelOffsetY(300, 1000)).to.eq(334);
    expect(labelOffsetY(980, 1000)).to.eq(946);
  });

  it('labels both shares with two decimals adding up to 100', () => {
    expect(shareLabel(39.58)).to.eq('60,42% | 39,58%');
    expect(shareLabel(40)).to.eq('60,00% | 40,00%');
  });
});
