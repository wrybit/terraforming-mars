import {expect} from 'chai';
import {winCountsByLineup} from '@/client/components/admin/winCounts';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

describe('winCountsByLineup', () => {
  const game = (isFinished: boolean, winner: string, ...names: Array<string>) =>
    ({isFinished, generation: 10, players: names.map((name) => ({name, isWinner: name === winner, victoryPoints: name === winner ? 100 : 80}))}) as AdminGameSummary;

  it('counts wins per lineup, finished games only, most played lineup first', () => {
    expect(winCountsByLineup([
      game(true, 'Jens', 'Jens', 'Daniel'),
      game(true, 'Daniel', 'Daniel', 'Jens'),
      game(true, 'Daniel', 'Jens', 'Daniel'),
      game(true, 'Martin', 'Jens', 'Daniel', 'Martin'),
      game(false, '', 'Jens', 'Daniel', 'Martin'),
    ])).deep.eq([
      {lineup: 'Daniel vs Jens', games: 3, counts: [{name: 'Daniel', wins: 2}, {name: 'Jens', wins: 1}], averageGenerations: 10, averageWinnerPoints: 100},
      {lineup: 'Daniel vs Jens vs Martin', games: 1, counts: [{name: 'Martin', wins: 1}, {name: 'Daniel', wins: 0}, {name: 'Jens', wins: 0}], averageGenerations: 10, averageWinnerPoints: 100},
    ]);
  });

  it('unknown generations do not lower the average', () => {
    const known = {isFinished: true, generation: 12, players: [{name: 'A', isWinner: true, victoryPoints: 90}, {name: 'B', isWinner: false, victoryPoints: 70}]} as AdminGameSummary;
    const unknown = {...known, generation: 0, players: [{name: 'A', isWinner: false, victoryPoints: 60}, {name: 'B', isWinner: true, victoryPoints: 70}]} as AdminGameSummary;
    const [lineup] = winCountsByLineup([known, unknown]);
    expect(lineup.averageGenerations).eq(12);
    expect(lineup.averageWinnerPoints).eq(80);
  });
});
