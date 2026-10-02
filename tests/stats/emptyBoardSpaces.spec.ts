import {expect} from 'chai';
import {emptyBoardSpaces} from '../../src/server/stats/emptyBoardSpaces';
import {BoardName} from '../../src/common/boards/BoardName';

describe('emptyBoardSpaces', () => {
  it('returns the board without tiles, same every time', () => {
    const spaces = emptyBoardSpaces(BoardName.HELLAS);
    expect(spaces.length).greaterThan(60);
    expect(spaces.every((space) => space.tileType === undefined)).is.true;
    expect(emptyBoardSpaces(BoardName.HELLAS)).deep.eq(spaces);
  });
});
