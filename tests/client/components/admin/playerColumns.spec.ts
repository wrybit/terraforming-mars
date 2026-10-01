import {expect} from 'chai';
import {playerColumns} from '@/client/components/admin/playerColumns';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

describe('playerColumns', () => {
  const game = (...names: Array<string>) => ({players: names.map((name) => ({name}))}) as AdminGameSummary;

  it('regular players first, one-off names at the end', () => {
    expect(playerColumns([game('Jens'), game('Daniel', 'Jens'), game('Jens', 'Martin', 'Daniel'), game('You'), game('Martin', 'Jens', 'Daniel')]))
      .deep.eq(['Jens', 'Daniel', 'Martin', 'You']);
  });

  it('equal counts are sorted by name, so columns do not jump', () => {
    expect(playerColumns([game('Martin', 'Daniel')])).deep.eq(['Daniel', 'Martin']);
  });

  it('a name counts once per game', () => {
    expect(playerColumns([game('A', 'A'), game('B'), game('B')])).deep.eq(['B', 'A']);
  });
});
