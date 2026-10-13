import {expect} from 'chai';
import {chipName, chipNameParts, PLAYER_COLUMNS, playersInColumn} from '@/client/components/admin/playerColumns';
import {AdminGameSummary, AdminPlayerSummary} from '@/common/admin/AdminGameSummary';

describe('playerColumns', () => {
  const game = (...names: Array<string>) => ({players: names.map((name) => ({name}))}) as AdminGameSummary;
  const names = (summary: AdminGameSummary, index: number) => playersInColumn(summary, PLAYER_COLUMNS[index]).map(chipName);

  it('always eleven columns: six player seats and five AI seats', () => {
    expect(PLAYER_COLUMNS).has.length(11);
  });

  it('humans and AI players each by seat, AI keeps its marker, extras join the last column of their kind', () => {
    const summary = game('Jens', 'Claude [AI+]', 'Omega [AI+]', 'Daniel', 'Teddy [AI-]', 'A', 'B', 'C', 'D', 'E',
      'X [AI]', 'Y [AI]', 'Z [AI]');
    expect(names(summary, 0)).deep.eq(['Jens']);
    expect(names(summary, 1)).deep.eq(['Daniel']);
    expect(names(summary, 5)).deep.eq(['D', 'E']);
    expect(names(summary, 6)).deep.eq(['Claude [AI+]']);
    expect(names(summary, 7)).deep.eq(['Omega [AI+]']);
    expect(names(summary, 8)).deep.eq(['Teddy [AI-]']);
    expect(names(summary, 10)).deep.eq(['Y [AI]', 'Z [AI]']);
  });

  it('older names with "(AI)" count as AI of normal strength', () => {
    const summary = game('Red', 'Green (AI)');
    expect(names(summary, 6)).deep.eq(['Green [AI]']);
    expect(names(summary, 0)).deep.eq(['Red']);
  });

  it('chip splits name and marker so only the name gets shortened', () => {
    expect(chipNameParts({name: 'Teddy [AI+]'} as AdminPlayerSummary)).deep.eq({name: 'Teddy', marker: '[AI+]'});
    expect(chipNameParts({name: 'Jens'} as AdminPlayerSummary)).deep.eq({name: 'Jens', marker: undefined});
  });
});
