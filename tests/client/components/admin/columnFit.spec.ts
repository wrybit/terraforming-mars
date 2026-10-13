import {expect} from 'chai';
import {emptyColumnsInDropOrder, fitColumns} from '@/client/components/admin/columnFit';
import {PLAYER_COLUMNS} from '@/client/components/admin/playerColumns';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

describe('columnFit', () => {
  const game = (...names: Array<string>) => ({players: names.map((name) => ({name}))}) as AdminGameSummary;
  // Two humans and one AI: players 3–6 and AI 2–5 are empty
  const games = [game('Jens', 'Daniel', 'Yellow [AI+]')];
  const label = (index: number) => PLAYER_COLUMNS.indexOf(emptyColumnsInDropOrder(PLAYER_COLUMNS, games)[index]);
  // 12 shared columns × 80 + 300 fixed + 17 × 4 spacing = 1328 for all eleven player columns
  const measure = {fixedWidth: 300, columnWidth: 80, spacing: 4};

  it('empty columns are dropped from the back: AI 5 first, then towards Player 3', () => {
    expect(emptyColumnsInDropOrder(PLAYER_COLUMNS, games)).has.length(8);
    expect([label(0), label(3), label(4), label(7)]).deep.eq([10, 7, 5, 2]);
  });

  it('keeps every column while there is room', () => {
    const fit = fitColumns(PLAYER_COLUMNS, games, {...measure, available: 1400});
    expect(fit.columns).has.length(11);
    expect(fit.minWidth).eq(1328);
  });

  it('drops only as many empty columns as needed', () => {
    // Each dropped column frees 84 px: two are enough for 1200
    const fit = fitColumns(PLAYER_COLUMNS, games, {...measure, available: 1200});
    expect(fit.columns).has.length(9);
    expect(fit.minWidth).eq(1160);
  });

  it('never drops a column with players; then the table scrolls', () => {
    const fit = fitColumns(PLAYER_COLUMNS, games, {...measure, available: 300});
    expect(fit.columns.map((column) => PLAYER_COLUMNS.indexOf(column))).deep.eq([0, 1, 6]);
    expect(fit.minWidth).greaterThan(300);
  });
});
