import {expect} from 'chai';
import {similarPlayerNames} from '@/client/components/admin/players/similarPlayerNames';
import {PlayerNameStats} from '@/client/components/admin/players/playerNameStats';

const player = (name: string, games: number): PlayerNameStats => ({name, games, color: 'red', wins: 0, lastTimeMs: 0, oldNames: []});

describe('similarPlayerNames', () => {
  it('proposes the name with fewer games into the one with more', () => {
    const suggestions = similarPlayerNames([player('jens', 3), player('Jens', 10), player('Jens H.', 1), player('Tobi', 5)]);
    expect(suggestions).deep.eq([{from: 'jens', to: 'Jens'}, {from: 'Jens H.', to: 'Jens'}]);
  });

  it('does not match short prefixes', () => {
    expect(similarPlayerNames([player('Tom', 3), player('Tomas', 1), player('Tobias', 2)])).deep.eq([]);
  });

  it('never proposes default names', () => {
    expect(similarPlayerNames([player('Blue', 9), player('blue', 2)], ['Blue', 'blue'])).deep.eq([]);
  });
});
