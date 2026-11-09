import {expect} from 'chai';
import {themeOfPath, withoutTheme} from '../../src/common/theme/themeUrl';

describe('themeUrl', () => {
  it('reads the world in front of the address', () => {
    expect(themeOfPath('dune/lobby')).eq('dune');
    expect(themeOfPath('dune')).eq('dune');
    expect(themeOfPath('mars/stats')).eq('mars');
    expect(themeOfPath('lobby')).is.undefined;
    expect(themeOfPath('')).is.undefined;
    // Only a whole first folder counts
    expect(themeOfPath('dunes/lobby')).is.undefined;
    expect(themeOfPath('lobby/room/ab12-dune')).is.undefined;
  });

  it('drops the world from the address', () => {
    expect(withoutTheme('dune/lobby/room/ab12-Runde')).eq('lobby/room/ab12-Runde');
    expect(withoutTheme('mars/')).eq('');
    expect(withoutTheme('dune')).eq('');
    expect(withoutTheme('stats')).eq('stats');
  });
});
