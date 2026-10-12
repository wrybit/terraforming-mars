import {expect} from 'chai';
import {
  OVERLAY_SCROLLBAR_GAP, OVERLAY_SCROLLBAR_MIN_THUMB, OVERLAY_SCROLLBAR_THICKNESS,
  railBox, scrollDeltaForDrag, snapToFrame, thumbGeometry,
} from '@/client/utils/overlayScrollbarGeometry';

describe('overlayScrollbarGeometry', () => {
  const frame = {left: 0, top: 0, right: 400, bottom: 300};

  it('snaps edges close to the box border to it, keeps the others', () => {
    const area = {left: 10, top: 60, right: 390, bottom: 290};
    expect(snapToFrame(area, frame)).to.deep.eq({left: 0, top: 60, right: 400, bottom: 300});
  });

  it('places the vertical bar 3 px from the right edge with a constant width', () => {
    const box = railBox(frame, 'vertical', false);
    expect(box.right).to.eq(400 - OVERLAY_SCROLLBAR_GAP);
    expect(box.right - box.left).to.eq(OVERLAY_SCROLLBAR_THICKNESS);
    expect(box.top).to.eq(OVERLAY_SCROLLBAR_GAP);
    expect(box.bottom).to.eq(300 - OVERLAY_SCROLLBAR_GAP);
  });

  it('leaves the shared corner free with bars in both directions', () => {
    const box = railBox(frame, 'horizontal', true);
    expect(box.bottom).to.eq(300 - OVERLAY_SCROLLBAR_GAP);
    expect(box.right).to.eq(400 - 2 * OVERLAY_SCROLLBAR_GAP - OVERLAY_SCROLLBAR_THICKNESS);
  });

  it('sizes and moves the thumb with the scroll position', () => {
    const metrics = {viewport: 100, content: 400, position: 0};
    expect(thumbGeometry(metrics, 200)).to.deep.eq({length: 50, offset: 0});
    expect(thumbGeometry({...metrics, position: 300}, 200)).to.deep.eq({length: 50, offset: 150});
    expect(thumbGeometry({...metrics, content: 100000}, 200).length).to.eq(OVERLAY_SCROLLBAR_MIN_THUMB);
  });

  it('lets the thumb follow the pointer exactly while dragged', () => {
    const metrics = {viewport: 100, content: 400, position: 0};
    // 150 px free track for 300 px of scrolling
    expect(scrollDeltaForDrag(15, metrics, 200)).to.eq(30);
  });
});
