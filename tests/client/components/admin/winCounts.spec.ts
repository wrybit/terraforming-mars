import {expect} from 'chai';
import {winCountsByLineup} from '@/client/components/admin/winCounts';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

describe('winCountsByLineup', () => {
  const game = (isFinished: boolean, winner: string, ...names: Array<string>) =>
    ({isFinished, players: names.map((name) => ({name, isWinner: name === winner}))}) as AdminGameSummary;

  it('counts wins per lineup, finished games only, most played lineup first', () => {
    expect(winCountsByLineup([
      game(true, 'Jens', 'Jens', 'Daniel'),
      game(true, 'Daniel', 'Daniel', 'Jens'),
      game(true, 'Daniel', 'Jens', 'Daniel'),
      game(true, 'Martin', 'Jens', 'Daniel', 'Martin'),
      game(false, '', 'Jens', 'Daniel', 'Martin'),
    ])).deep.eq([
      {lineup: 'Daniel vs Jens', games: 3, counts: [{name: 'Daniel', wins: 2}, {name: 'Jens', wins: 1}]},
      {lineup: 'Daniel vs Jens vs Martin', games: 1, counts: [{name: 'Martin', wins: 1}, {name: 'Daniel', wins: 0}, {name: 'Jens', wins: 0}]},
    ]);
  });
});
