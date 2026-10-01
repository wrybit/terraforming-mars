import {expect} from 'chai';
import {winCounts} from '@/client/components/admin/winCounts';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

describe('winCounts', () => {
  const game = (isFinished: boolean, winner: string, ...names: Array<string>) =>
    ({isFinished, players: names.map((name) => ({name, isWinner: name === winner}))}) as AdminGameSummary;

  it('counts wins and games of finished games only', () => {
    expect(winCounts([game(true, 'Jens', 'Jens', 'Daniel'), game(true, 'Daniel', 'Jens', 'Daniel', 'Martin'), game(true, 'Jens', 'Jens', 'Martin'), game(false, '', 'Martin')]))
      .deep.eq([
        {name: 'Jens', wins: 2, games: 3},
        {name: 'Daniel', wins: 1, games: 2},
        {name: 'Martin', wins: 0, games: 2},
      ]);
  });
});
