import {expect} from 'chai';
import {BoardName} from '../../../src/common/boards/BoardName';
import {RandomBoardOption} from '../../../src/common/boards/RandomBoardOption';
import {boardOptions} from '../../../src/common/boards/randomBoardOptions';
import {boardPool, randomOptionOf, singleBoardValue} from '../../../src/common/boards/boardPool';

describe('boardPool', () => {
  it('takes the pool, drops unknown names and duplicates', () => {
    expect(boardPool([BoardName.HELLAS, 'mordor', BoardName.HELLAS, BoardName.ELYSIUM])).deep.eq([BoardName.HELLAS, BoardName.ELYSIUM]);
  });

  it('converts the older single board, including random options', () => {
    expect(boardPool(undefined, BoardName.HOLLANDIA)).deep.eq([BoardName.HOLLANDIA]);
    expect(boardPool(undefined, RandomBoardOption.OFFICIAL)).deep.eq(boardOptions(RandomBoardOption.OFFICIAL));
  });

  it('falls back to Tharsis when nothing valid is left', () => {
    expect(boardPool([])).deep.eq([BoardName.THARSIS]);
    expect(boardPool('hellas')).deep.eq([BoardName.THARSIS]);
    expect(boardPool(undefined, 'random everything')).deep.eq([BoardName.THARSIS]);
  });

  it('names a pool by one value', () => {
    expect(singleBoardValue([BoardName.HELLAS])).eq(BoardName.HELLAS);
    expect(singleBoardValue([...boardOptions(RandomBoardOption.OFFICIAL)].reverse())).eq(RandomBoardOption.OFFICIAL);
    expect(singleBoardValue([BoardName.HELLAS, BoardName.ELYSIUM])).eq(RandomBoardOption.ALL);
    expect(randomOptionOf([BoardName.HELLAS, BoardName.ELYSIUM])).is.undefined;
  });
});
