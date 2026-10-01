import {expect} from 'chai';
import {resolveMobileLayout} from '@/client/utils/mobileLayout';
import {boardMaxHeight, cardColumns, choiceGridColumns, fitScale} from '@/client/utils/mobileFit';
import {transposedCopy} from '@/client/utils/transposeTable';

describe('mobileLayout', () => {
  it('uses touch devices and narrow windows in auto mode and honours overrides', () => {
    expect(resolveMobileLayout('auto', true, false)).to.be.true;
    expect(resolveMobileLayout('auto', false, true)).to.be.true;
    expect(resolveMobileLayout('auto', false, false)).to.be.false;
    expect(resolveMobileLayout('on', false, false)).to.be.true;
    expect(resolveMobileLayout('off', true, true)).to.be.false;
  });
});

describe('mobileFit', () => {
  it('picks 2 columns on phones, 3 on tablets in portrait, 4 in landscape', () => {
    expect(cardColumns(374)).to.eq(2);
    expect(cardColumns(788)).to.eq(3);
    expect(cardColumns(1334)).to.eq(4);
  });

  it('arranges choice grids square in landscape and upright in portrait, as far as the width allows', () => {
    expect(choiceGridColumns(374, 5, true)).to.eq(2);
    expect(choiceGridColumns(788, 5, true)).to.eq(2);
    expect(choiceGridColumns(788, 10, true)).to.eq(3);
    expect(choiceGridColumns(1334, 5, false)).to.eq(3);
    expect(choiceGridColumns(1334, 4, false)).to.eq(2);
  });

  it('scales items to fit the columns, never enlarging them', () => {
    expect(fitScale(374, 250, 2)).to.be.closeTo(0.724, 0.001);
    expect(fitScale(2000, 250, 2)).to.eq(1);
    expect(fitScale(374, 0, 2)).to.eq(1);
  });
});

describe('boardMaxHeight', () => {
  it('leaves room for the bars in portrait and uses the full height in landscape', () => {
    expect(boardMaxHeight(390, 844)).to.be.closeTo(523, 1);
    expect(boardMaxHeight(1024, 768)).to.eq(588);
  });
});

describe('transposedCopy', () => {
  it('turns rows into columns, drops spanning rows and moves row colours onto the cells', () => {
    const table = document.createElement('table');
    table.innerHTML = '<tr><th colspan="2">Group</th></tr>' +
      '<tr><th>Name</th><th>Total</th></tr>' +
      '<tr class="player_translucent_bg_color_red game-end-winner-row"><td>Mira</td><td>35</td></tr>';
    const copy = transposedCopy(table);
    expect(copy.classList.contains('mb-transposed')).to.be.true;
    expect(copy.rows).to.have.length(2);
    expect(copy.rows[1].cells[0].textContent).to.eq('Total');
    const cell = copy.rows[1].cells[1];
    expect(cell.textContent).to.eq('35');
    expect(cell.classList.contains('player_translucent_bg_color_red')).to.be.true;
    expect(cell.classList.contains('mb-winner-col')).to.be.true;
    expect(table.rows).to.have.length(3);
  });
});
