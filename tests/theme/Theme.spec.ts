import {expect} from 'chai';
import {themeConflicts} from '../../src/common/theme/Theme';
import {BoardName} from '../../src/common/boards/BoardName';
import {RandomBoardOption} from '../../src/common/boards/RandomBoardOption';

describe('Theme', () => {
  it('Mars accepts every board but Arrakis', () => {
    expect(themeConflicts('mars', BoardName.HELLAS, {venus: true})).deep.eq([]);
    expect(themeConflicts('mars', RandomBoardOption.ALL, {})).deep.eq([]);
    expect(themeConflicts('mars', BoardName.ARRAKIS, {})).has.length(1);
  });

  it('Dune needs Arrakis and only the covered expansions', () => {
    expect(themeConflicts('dune', BoardName.ARRAKIS, {corpera: true, prelude: true, prelude2: true, venus: false})).deep.eq([]);
    expect(themeConflicts('dune', BoardName.THARSIS, {})).has.length(1);
    expect(themeConflicts('dune', undefined, {})).has.length(1);
    expect(themeConflicts('dune', BoardName.ARRAKIS, {colonies: true})).has.length(1);
  });
});
