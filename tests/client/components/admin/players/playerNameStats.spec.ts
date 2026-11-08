import {expect} from 'chai';
import {playerNameStats, sharedGameCount} from '@/client/components/admin/players/playerNameStats';
import {statsGame} from './playerFixtures';

describe('playerNameStats', () => {
  const games = [
    statsGame(1, [{name: 'Jens', color: 'blue', isWinner: true}, {name: 'jens'}]),
    statsGame(2, [{name: 'Jens', color: 'green'}, {name: 'Tobi', isWinner: true}]),
  ];

  it('counts games and wins per name, most games first, colour of the latest game', () => {
    const stats = playerNameStats(games, [{id: 'a1', from: 'Jens H.', to: 'Jens', createdTimeMs: 0}]);
    expect(stats.map((player) => player.name)).deep.eq(['Jens', 'jens', 'Tobi']);
    expect(stats[0]).deep.include({games: 2, wins: 1, lastTimeMs: 2, color: 'green', oldNames: ['Jens H.']});
  });

  it('counts the games two names played together', () => {
    expect(sharedGameCount(games, 'Jens', 'jens')).eq(1);
    expect(sharedGameCount(games, 'jens', 'Tobi')).eq(0);
  });
});
