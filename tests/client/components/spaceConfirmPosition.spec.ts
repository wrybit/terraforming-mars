import {expect} from 'chai';
import {spaceConfirmPosition} from '@/client/components/spaceConfirmPosition';

describe('spaceConfirmPosition', () => {
  const space = {left: 500, top: 300, right: 540, bottom: 340};

  it('opens to the right of the space when there is room', () => {
    const p = spaceConfirmPosition(space, 200, 100, 1440, 900);
    expect(p.side).eq('right');
    expect(p.left).eq(540 + 12);
    expect(p.top).eq(270); // centered on the space
  });

  it('opens to the left when the window edge is in the way on the right', () => {
    const nearRightEdge = {left: 1300, top: 300, right: 1340, bottom: 340};
    const p = spaceConfirmPosition(nearRightEdge, 200, 100, 1440, 900);
    expect(p.side).eq('left');
    expect(p.left).eq(1300 - 12 - 200);
  });

  it('stays vertically within the window', () => {
    const nearBottom = {left: 500, top: 870, right: 540, bottom: 900};
    const p = spaceConfirmPosition(nearBottom, 200, 100, 1440, 900);
    expect(p.top).eq(900 - 8 - 100);
  });
});
