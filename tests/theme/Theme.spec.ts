import {expect} from 'chai';
import {themeConflicts} from '../../src/common/theme/Theme';
import {BoardName} from '../../src/common/boards/BoardName';
import {RandomBoardOption} from '../../src/common/boards/RandomBoardOption';
import {boardOptions} from '../../src/common/boards/randomBoardOptions';

describe('Theme', () => {
  it('Mars accepts every board but Arrakis', () => {
    expect(themeConflicts('mars', [BoardName.HELLAS], {venus: true})).deep.eq([]);
    expect(themeConflicts('mars', boardOptions(RandomBoardOption.ALL), {})).deep.eq([]);
    expect(themeConflicts('mars', [BoardName.ARRAKIS_61], {})).has.length(1);
    expect(themeConflicts('mars', [BoardName.HELLAS, BoardName.ARRAKIS_91], {})).has.length(1);
  });

  it('Dune needs exactly one Arrakis and only the covered expansions', () => {
    expect(themeConflicts('dune', [BoardName.ARRAKIS_61], {corpera: true, prelude: true, prelude2: true, venus: false})).deep.eq([]);
    expect(themeConflicts('dune', [BoardName.THARSIS], {})).has.length(1);
    expect(themeConflicts('dune', [], {})).has.length(1);
    expect(themeConflicts('dune', [BoardName.ARRAKIS_61, BoardName.ARRAKIS_91], {})).has.length(1);
    expect(themeConflicts('dune', [BoardName.ARRAKIS_61], {colonies: true})).has.length(1);
  });

  it('random pools never contain Arrakis', () => {
    expect(boardOptions(RandomBoardOption.ALL)).not.include(BoardName.ARRAKIS_61);
    expect(boardOptions(RandomBoardOption.ALL)).not.include(BoardName.ARRAKIS_91);
  });
});
