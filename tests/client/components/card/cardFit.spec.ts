import {expect} from 'chai';
import {CARD_ROW_ZOOM, cardScrollSpace, contentOverflowsCard, contentRunsIntoFooter, fittingRowZoom} from '@/client/components/card/cardFit';

type Box = {left: number, top: number, width: number, height: number};

// jsdom has no layout: every element gets the box the test gives it
function place(element: Element, box: Box): void {
  element.getBoundingClientRect = () => ({
    ...box, x: box.left, y: box.top, right: box.left + box.width, bottom: box.top + box.height, toJSON: () => ({}),
  }) as DOMRect;
}

function card(contentBottom: number, scene?: Box): HTMLElement {
  const element = document.createElement('div');
  element.className = 'card-container';
  element.innerHTML = '<span class="card-scene"></span><div class="card-content"><div class="card-rows"><div class="card-row"><i></i></div></div>' +
    '<div class="card-description">text</div></div>';
  place(element, {left: 0, top: 0, width: 248, height: 313});
  Object.defineProperty(element, 'offsetHeight', {value: 313});
  Object.defineProperty(element, 'clientTop', {value: 4});
  place(element.querySelector('.card-scene')!, scene ?? {left: 0, top: 0, width: 0, height: 0});
  place(element.querySelector('.card-content')!, {left: 4, top: 73, width: 240, height: 236});
  place(element.querySelector('.card-row')!, {left: 30, top: 80, width: 180, height: 40});
  place(element.querySelector('.card-description')!, {left: 14, top: 130, width: 220, height: contentBottom - 130});
  return element;
}

describe('cardFit', () => {
  it('finds content below the bottom edge of the card', () => {
    expect(contentOverflowsCard(card(300))).is.false;
    expect(contentOverflowsCard(card(312))).is.true;
  });

  it('keeps the content of a Dune card above its scene strip, apart from the faded top of the strip', () => {
    const scene = {left: 4, top: 240, width: 240, height: 69};
    expect(contentRunsIntoFooter(card(240, scene))).is.false;
    expect(contentRunsIntoFooter(card(270, scene))).is.true;
  });

  it('gives a card that runs into its scene strip a scroll area with room for the strip below the last line', () => {
    const scene = {left: 4, top: 240, width: 240, height: 69};
    expect(cardScrollSpace(card(220, scene))).is.undefined;
    expect(cardScrollSpace(card(290, scene))).deep.eq({contentHeight: 236, bottomSpace: 75});
  });

  it('zooms the icon rows less where the widest row would reach past the frame, never below 1', () => {
    const element = card(200);
    expect(fittingRowZoom(element)).eq(CARD_ROW_ZOOM);
    place(element.querySelector('.card-row i')!, {left: 0, top: 80, width: 250, height: 40});
    const zoom = fittingRowZoom(element);
    expect(zoom).lessThan(CARD_ROW_ZOOM);
    expect(zoom).greaterThanOrEqual(1);
  });
});
