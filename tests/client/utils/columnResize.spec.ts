import {expect} from 'chai';
import {labelOffsetY, shareLabel, DEFAULT_BOARD_SHARE, MAX_BOARD_SHARE, MIN_BOARD_SHARE, applyBoardShare, loadBoardShare, setBoardShare, shareFromPointer} from '@/client/utils/columnResize';

describe('columnResize', () => {
  beforeEach(() => localStorage.removeItem('player_home_board_share'));

  it('computes the board share from the pointer position and keeps it within bounds', () => {
    const container = {left: 0, width: 2000};
    expect(shareFromPointer(container, 1200)).to.eq(40);
    expect(shareFromPointer(container, 1900)).to.eq(MIN_BOARD_SHARE);
    expect(shareFromPointer(container, 100)).to.eq(MAX_BOARD_SHARE);
  });

  it('defaults to 40 % and remembers a chosen share', () => {
    expect(loadBoardShare()).to.eq(DEFAULT_BOARD_SHARE);
    const container = document.createElement('div');
    setBoardShare(container, 42);
    expect(loadBoardShare()).to.eq(42);
    expect(container.style.getPropertyValue('--player-home-board-share')).to.eq('42fr');
    expect(container.style.getPropertyValue('--player-home-main-share')).to.eq('58fr');
  });

  it('forgets the share when reset to the default', () => {
    const container = document.createElement('div');
    setBoardShare(container, 50);
    setBoardShare(container, DEFAULT_BOARD_SHARE);
    applyBoardShare(container, loadBoardShare());
    expect(localStorage.getItem('player_home_board_share')).to.be.null;
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
