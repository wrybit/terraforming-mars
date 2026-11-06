import {expect} from 'chai';
import {milestonesBoxTarget} from '@/client/utils/milestonesBoxResize';

// jsdom has no layout: fake the measured heights
function sized(element: HTMLElement, height: number): HTMLElement {
  element.getBoundingClientRect = () => ({height} as DOMRect);
  return element;
}

describe('milestonesBoxResize', () => {
  function setup(boxHeight: number, logHeight: number) {
    const container = document.createElement('div');
    const box = sized(document.createElement('div'), boxHeight);
    const log = sized(document.createElement('div'), logHeight);
    log.className = 'log-panel or-tab-panel';
    container.append(box, log);
    return milestonesBoxTarget(box);
  }

  it('lets the box grow until the log reaches its minimum height', () => {
    expect(setup(200, 400).limits()).to.deep.eq({min: 80, max: 480});
  });

  it('keeps the box when the log is already at its minimum', () => {
    expect(setup(200, 100).limits()).to.deep.eq({min: 80, max: 200});
  });

  it('sets a fixed height and goes back to the natural one', () => {
    const container = document.createElement('div');
    const box = document.createElement('div');
    container.append(box);
    const target = milestonesBoxTarget(box);
    target.apply(150);
    expect(box.style.height).to.eq('150px');
    target.apply(undefined);
    expect(box.style.height).to.eq('');
  });
});
