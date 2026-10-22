import {expect} from 'chai';
import {BoardName} from '../../../src/common/boards/BoardName';
import {getGlobalParameterMaximums} from '../../../src/common/boards/GlobalParameterMaximums';

describe('GlobalParameterMaximums', () => {
  it('gives the large Arrakis the Amazonis Planitia tracks', () => {
    // The results chart scales "% completed" with these maximums: a wrong board would pass 100%
    expect(getGlobalParameterMaximums(BoardName.ARRAKIS_91)).deep.eq(getGlobalParameterMaximums(BoardName.AMAZONIS_PLANITIA));
    expect(getGlobalParameterMaximums(BoardName.ARRAKIS_61)).deep.eq(getGlobalParameterMaximums(BoardName.THARSIS));
    expect(getGlobalParameterMaximums(BoardName.ARRAKIS_91).temperature).eq(14);
  });
});
