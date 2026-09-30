import {expect} from 'chai';
import {HORIZONTALLY_SCROLLED_CLASS, markHorizontalScroll} from '@/client/components/mobile/horizontalScroll';

describe('horizontalScroll', () => {
  it('marks an element only while it is scrolled sideways', () => {
    const element = document.createElement('div');
    const scroll = (left: number) => {
      Object.defineProperty(element, 'scrollLeft', {value: left, configurable: true});
      const event = new Event('scroll');
      Object.defineProperty(event, 'target', {value: element});
      markHorizontalScroll(event);
    };
    scroll(40);
    expect(element.classList.contains(HORIZONTALLY_SCROLLED_CLASS)).to.be.true;
    scroll(0);
    expect(element.classList.contains(HORIZONTALLY_SCROLLED_CLASS)).to.be.false;
  });
});
