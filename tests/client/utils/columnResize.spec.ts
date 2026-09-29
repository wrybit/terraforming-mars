import {expect} from 'chai';
import {DEFAULT_BOARD_SHARE, MAX_BOARD_SHARE, MIN_BOARD_SHARE, applyBoardShare, loadBoardShare, setBoardShare, shareFromPointer} from '@/client/utils/columnResize';

describe('columnResize', () => {
  beforeEach(() => localStorage.removeItem('player_home_board_share'));

  it('computes the board share from the pointer position and keeps it within bounds', () => {
    const container = {left: 0, width: 2000};
    expect(shareFromPointer(container, 1300)).to.eq(35);
    expect(shareFromPointer(container, 1900)).to.eq(MIN_BOARD_SHARE);
    expect(shareFromPointer(container, 100)).to.eq(MAX_BOARD_SHARE);
  });

  it('defaults to 35 % and remembers a chosen share', () => {
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
});
