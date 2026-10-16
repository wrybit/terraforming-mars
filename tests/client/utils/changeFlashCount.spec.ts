import {expect} from 'chai';
import {afterEach, beforeEach, vi} from 'vitest';
import {countElement, isHoldingValue, releaseHeldValue, showPreviousValue} from '@/client/utils/changeFlashCount';

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

  describe('while a count runs', () => {
    // Frames by hand: each call of nextFrame runs the waiting animation step at the given time
    let frames: Array<(time: number) => void>;
    function nextFrame(time: number): void {
      const waiting = frames;
      frames = [];
      waiting.forEach((step) => step(time));
    }
    beforeEach(() => {
      frames = [];
      vi.stubGlobal('requestAnimationFrame', (step: (time: number) => void) => frames.push(step));
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('a value Vue writes during the count stays (feedback #d43acd: 11 stuck instead of 0)', () => {
      const element = numberElement('11');
      showPreviousValue(element, 19, false);
      countElement(element, 19, false, 0, 'loss');
      nextFrame(0);
      nextFrame(500);
      // Next server state while counting: Vue writes 0 into the same node
      element.firstChild!.nodeValue = '0';
      nextFrame(1000);
      nextFrame(3000);
      expect(element.textContent).eq('0');
    });

    it('a new hold during the count keeps the value Vue rendered', () => {
      const element = numberElement('11');
      countElement(element, 19, false, 0, 'loss');
      nextFrame(0);
      element.firstChild!.nodeValue = '0';
      showPreviousValue(element, 11, false);
      expect(element.textContent).eq('11');
      expect(isHoldingValue(element)).is.true;
      // The old count does not write any more
      nextFrame(3000);
      expect(element.textContent).eq('11');
      releaseHeldValue(element);
      expect(element.textContent).eq('0');
    });

    it('a hold without a Vue write in between ends on the count\'s target, not an in-between number', () => {
      const element = numberElement('11');
      countElement(element, 19, false, 0, 'loss');
      nextFrame(0);
      nextFrame(700);
      showPreviousValue(element, 19, false);
      releaseHeldValue(element);
      expect(element.textContent).eq('11');
    });
  });
});
