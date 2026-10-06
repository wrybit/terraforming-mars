import {expect} from 'chai';
import {emptyBoardSpaces} from '../../src/server/stats/emptyBoardSpaces';
import {BoardName} from '../../src/common/boards/BoardName';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {RANDOM_BOARD} from '../../src/common/stats/statsBoardKey';

describe('emptyBoardSpaces', () => {
  it('returns the board without tiles, same every time', () => {
    const spaces = emptyBoardSpaces(BoardName.HELLAS);
    expect(spaces.length).greaterThan(60);
    expect(spaces.every((space) => space.tileType === undefined)).is.true;
    expect(emptyBoardSpaces(BoardName.HELLAS)).deep.eq(spaces);
  });

  it('shows shuffled boards as a plain grid without oceans and bonuses', () => {
    const spaces = emptyBoardSpaces(RANDOM_BOARD);
    expect(spaces.length).eq(emptyBoardSpaces(BoardName.THARSIS).length);
    const mars = spaces.filter((space) => space.spaceType !== SpaceType.COLONY);
    expect(mars.every((space) => space.spaceType === SpaceType.LAND && space.bonus.length === 0)).is.true;
  });
});
