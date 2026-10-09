import {expect} from 'chai';
import {countElement, releaseHeldValue, showPreviousValue} from '@/client/utils/changeFlashCount';

// A number as in the player bar: one element with one text node that Vue writes
function numberElement(value: string): HTMLElement {
  const element = document.createElement('span');
  element.textContent = value;
  return element;
}

describe('changeFlashCount', () => {
  it('release shows the rendered value again', () => {
    const element = numberElement('2');
    showPreviousValue(element, 8, false);
    expect(element.textContent).eq('8');
    releaseHeldValue(element);
    expect(element.textContent).eq('2');
  });

  it('release keeps a value Vue wrote during the hold', () => {
    const element = numberElement('2');
    showPreviousValue(element, 8, false);
    element.firstChild!.nodeValue = '5';
    releaseHeldValue(element);
    expect(element.textContent).eq('5');
  });

  it('a later count does not fall back to an old rendered value', () => {
    const element = numberElement('8');
    showPreviousValue(element, 3, false);
    // The first count ends the hold
    countElement(element, 8, false, 0, 'gain');
    // Newer server state: Vue writes 2, nothing to count
    element.firstChild!.nodeValue = '2';
    expect(countElement(element, 2, false, 0, 'loss')).eq(false);
    expect(element.textContent).eq('2');
  });
});
