import {expect} from 'chai';
import {measureGoodsColumnWidths} from '@/client/components/overview/goodsBoxWidths';

describe('goodsBoxWidths', () => {
  it('measures nothing while the goods section is hidden', () => {
    // Without boxes the caller must keep its widths: zeros would let the section fit, show and hide again endlessly
    const table = document.createElement('div');
    table.innerHTML = '<div class="players-table-row"><span class="players-table-tag"></span></div>';
    expect(measureGoodsColumnWidths(table, 6)).is.undefined;
  });

  it('measures every column when boxes are rendered', () => {
    const table = document.createElement('div');
    table.innerHTML = '<div class="players-table-row">' +
      '<div class="players-table-goods"><span class="players-table-goods-stock"></span></div>'.repeat(6) + '</div>';
    const widths = measureGoodsColumnWidths(table, 6);
    expect(widths?.box).has.length(6);
    expect(widths?.production).has.length(6);
  });
});
