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

  it('counts every AI player as the account of its strength, with a fixed colour', () => {
    const stats = playerNameStats([
      statsGame(1, [{name: 'Jens'}, {name: 'Paul [AI+]', color: 'blue', isWinner: true}, {name: 'Leto [AI+]'}]),
      statsGame(2, [{name: 'Jens'}, {name: 'Alia [AI-]'}, {name: 'Stilgar (AI)'}]),
    ], []);
    expect(stats.map((player) => player.name)).deep.eq(['Jens', 'Bot [AI-]', 'Bot [AI]', 'Bot [AI+]']);
    // Two strong AIs in game 1 are one game of "Bot [AI+]"
    expect(stats.find((player) => player.name === 'Bot [AI+]')).deep.include({games: 1, wins: 1, color: 'red', emoji: '🤖', isBot: true});
    expect(stats.find((player) => player.name === 'Bot [AI-]')).deep.include({color: 'yellow', isBot: true});
    expect(stats.find((player) => player.name === 'Bot [AI]')).deep.include({color: 'orange', isBot: true});
    expect(stats[0].isBot).is.false;
  });

  it('takes colour and emoji the admin chose', () => {
    const stats = playerNameStats(games, [], [{name: 'Tobi', color: 'purple', emoji: '🚀'}, {name: 'Jens', emoji: '🌱'}]);
    expect(stats.find((player) => player.name === 'Tobi')).deep.include({color: 'purple', emoji: '🚀'});
    // Without a chosen colour the latest game's colour stays
    expect(stats.find((player) => player.name === 'Jens')).deep.include({color: 'green', emoji: '🌱'});
  });

  it('a name AI players were merged into by hand counts as the account of their strength', () => {
    const stats = playerNameStats([statsGame(1, [{name: 'Jens'}, {name: 'Strong AI', isWinner: true}])],
      [{id: 'a1', from: 'Paul [AI+]', to: 'Strong AI', createdTimeMs: 0}]);
    expect(stats.find((player) => player.isBot)).deep.include({name: 'Bot [AI+]', color: 'red', wins: 1, oldNames: []});
  });
});
