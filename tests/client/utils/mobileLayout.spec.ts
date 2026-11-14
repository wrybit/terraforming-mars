import {expect} from 'chai';
import {resolveLayoutState} from '@/client/utils/mobileLayout';
import {boardMaxHeight, cardColumns, cardGridColumns, choiceGridColumns, fitScale} from '@/client/utils/mobileFit';
import {transposedCopy} from '@/client/utils/transposeTable';

describe('mobileLayout', () => {
  it('decides the layout state by window size alone', () => {
    expect(resolveLayoutState(320, 568)).to.eq('phone-portrait');
    expect(resolveLayoutState(390, 844)).to.eq('phone-portrait');
    expect(resolveLayoutState(844, 390)).to.eq('phone-landscape');
    expect(resolveLayoutState(744, 1133)).to.eq('tablet-portrait');
    expect(resolveLayoutState(1133, 744)).to.eq('tablet-landscape');
    expect(resolveLayoutState(1024, 1366)).to.eq('tablet-portrait');
    expect(resolveLayoutState(1100, 800)).to.eq('tablet-landscape');
    expect(resolveLayoutState(1279, 800)).to.eq('tablet-landscape');
    expect(resolveLayoutState(1280, 800)).to.eq('desktop');
    expect(resolveLayoutState(1366, 1024)).to.eq('desktop');
    expect(resolveLayoutState(3840, 2160)).to.eq('desktop');
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

  it('keeps few cards as the square block and fills the rows with many cards', () => {
    expect(cardGridColumns(1334, 4, false)).to.eq(2);
    expect(cardGridColumns(1334, 6, false)).to.eq(3);
    expect(cardGridColumns(1334, 9, false)).to.eq(4);
    expect(cardGridColumns(788, 9, true)).to.eq(3);
    expect(cardGridColumns(374, 9, true)).to.eq(2);
  });

  it('scales items to fit the columns, never enlarging them', () => {
    expect(fitScale(374, 250, 2)).to.be.closeTo(0.724, 0.001);
    expect(fitScale(2000, 250, 2)).to.eq(1);
    expect(fitScale(374, 0, 2)).to.eq(1);
  });
});

describe('boardMaxHeight', () => {
  it('leaves room for the bars in portrait and for the rows around the board box in landscape', () => {
    expect(boardMaxHeight(390, 844)).to.be.closeTo(523, 1);
    expect(boardMaxHeight(1024, 768)).to.eq(438);
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
