import {expect} from 'chai';
import {CARD_ROW_ZOOM, contentOverflowsCard, fittingRowZoom} from '@/client/components/card/cardFit';

type Box = {left: number, top: number, width: number, height: number};

// jsdom has no layout: every element gets the box the test gives it
function place(element: Element, box: Box): void {
  element.getBoundingClientRect = () => ({
    ...box, x: box.left, y: box.top, right: box.left + box.width, bottom: box.top + box.height, toJSON: () => ({}),
  }) as DOMRect;
}

function card(contentBottom: number): HTMLElement {
  const element = document.createElement('div');
  element.className = 'card-container';
  element.innerHTML = '<div class="card-content"><div class="card-rows"><div class="card-row"><i></i></div></div>' +
    '<div class="card-description">text</div></div>';
  place(element, {left: 0, top: 0, width: 248, height: 313});
  place(element.querySelector('.card-content')!, {left: 4, top: 73, width: 240, height: 236});
  place(element.querySelector('.card-row')!, {left: 30, top: 80, width: 180, height: 40});
  place(element.querySelector('.card-row i')!, {left: 30, top: 80, width: 180, height: 40});
  place(element.querySelector('.card-description')!, {left: 14, top: 130, width: 220, height: contentBottom - 130});
  return element;
}

describe('cardFit', () => {
  it('finds content below the bottom edge of the card', () => {
    expect(contentOverflowsCard(card(300))).is.false;
    expect(contentOverflowsCard(card(312))).is.true;
  });

  it('zooms the icon rows less where the widest row would reach past the content box, without a lower limit', () => {
    const element = card(200);
    expect(fittingRowZoom(element)).eq(CARD_ROW_ZOOM);
    expect(fittingRowZoom(element, 1)).eq(1);
    // 240 px content box less 8 px room on each side
    place(element.querySelector('.card-row i')!, {left: 0, top: 80, width: 448, height: 40});
    expect(fittingRowZoom(element)).eq(0.6);
  });
});
