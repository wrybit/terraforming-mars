import {expect} from 'chai';
import {chipName, PLAYER_COLUMNS, playersInColumn} from '@/client/components/admin/playerColumns';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

describe('playerColumns', () => {
  const game = (...names: Array<string>) => ({players: names.map((name) => ({name}))}) as AdminGameSummary;
  const names = (summary: AdminGameSummary, index: number) => playersInColumn(summary, PLAYER_COLUMNS[index]).map(chipName);

  it('always nine columns: six player seats and three AI strengths', () => {
    expect(PLAYER_COLUMNS).has.length(9);
  });

  it('humans by seat, AI players of the same strength share a cell, extra humans join the last seat', () => {
    const summary = game('Jens', 'Claude [AI+]', 'Omega [AI+]', 'Daniel', 'Teddy [AI-]', 'A', 'B', 'C', 'D', 'E');
    expect(names(summary, 0)).deep.eq(['Jens']);
    expect(names(summary, 1)).deep.eq(['Daniel']);
    expect(names(summary, 5)).deep.eq(['D', 'E']);
    expect(names(summary, 6)).deep.eq(['Teddy']);
    expect(names(summary, 7)).deep.eq([]);
    expect(names(summary, 8)).deep.eq(['Claude', 'Omega']);
  });

  it('older names with "(AI)" count as the normal strength', () => {
    const summary = game('Red', 'Green (AI)');
    expect(names(summary, 7)).deep.eq(['Green']);
    expect(names(summary, 0)).deep.eq(['Red']);
  });
});
