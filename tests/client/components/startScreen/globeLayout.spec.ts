import {expect} from 'chai';
import {measureGlobeLayout} from '@/client/components/startScreen/globeLayout';

function elementAt(top: number): HTMLElement {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => ({top} as DOMRect);
  return element;
}

describe('globeLayout', () => {
  it('keeps the desktop globe unscaled (90px buttons, 5px gap)', () => {
    const layout = measureGlobeLayout([0, 95, 190].map((top) => elementAt(100 + top)), elementAt(0));
    expect(layout?.scale).to.be.closeTo(1, 1e-9);
    expect(layout?.placements.map((placement) => placement.spriteTop)).to.deep.eq([90, 185, 280]);
    expect(layout?.titleOffset).to.be.closeTo(10, 1e-9);
  });

  it('scales the globe by the button pitch so all arcs line up (tablet)', () => {
    const layout = measureGlobeLayout([0, 109, 218].map(elementAt), undefined);
    expect(layout?.scale).to.be.closeTo(109 / 95, 1e-9);
    expect(layout?.placements[1].spriteTop).to.be.closeTo(90 + 95, 1e-9);
  });
});
