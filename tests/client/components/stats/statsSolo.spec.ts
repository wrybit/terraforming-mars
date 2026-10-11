import {expect} from 'chai';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';
import {soloStats} from '@/client/components/stats/statsSolo';

describe('soloStats', () => {
  const game = (isFinished: boolean, generation: number, ...players: Array<[string, boolean, number]>) =>
    ({isFinished, generation, players: players.map(([name, isWinner, victoryPoints]) => ({name, isWinner, victoryPoints}))}) as AdminGameSummary;

  it('counts finished solo games per player, group games and running games are left out', () => {
    expect(soloStats([
      game(true, 14, ['Venrix', false, 40]),
      game(true, 0, ['Venrix', true, 60]),
      game(true, 12, ['Jens', true, 70]),
      game(false, 5, ['Jens', false, 10]),
      game(true, 10, ['Jens', true, 90], ['Daniel', false, 80]),
    ])).deep.eq([
      {name: 'Venrix', games: 2, wins: 1, averageGenerations: 14, averagePoints: 50},
      {name: 'Jens', games: 1, wins: 1, averageGenerations: 12, averagePoints: 70},
    ]);
  });
});
