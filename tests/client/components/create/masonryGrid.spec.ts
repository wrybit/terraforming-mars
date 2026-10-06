import {expect} from 'chai';
import {balancedColumns} from '@/client/components/create/masonryGrid';

function columnHeights(heights: Array<number>, columns: Array<number>): Array<number> {
  const totals = [0, 0];
  columns.forEach((column, index) => totals[column] += heights[index]);
  return totals;
}

describe('masonryGrid', () => {
  it('keeps the first cards side by side and balances the rest', () => {
    const heights = [400, 900, 100, 150, 200, 250, 200];
    const columns = balancedColumns(heights, 2);
    expect(columns.slice(0, 2)).deep.eq([0, 1]);
    expect(columnHeights(heights, columns)).deep.eq([1100, 1100]);
  });

  it('works without further cards', () => {
    expect(balancedColumns([300, 200], 2)).deep.eq([0, 1]);
  });
});
