import {expect} from 'chai';
import {tooltipPosition} from '@/client/directives/GlassTooltip';

describe('tooltipPosition', () => {
  it('centers the tooltip and the nose over the anchor', () => {
    expect(tooltipPosition({left: 400, width: 40}, 200, 1000)).to.deep.eq({left: 320, noseX: 100});
  });

  it('keeps the tooltip inside the window but the nose over the anchor', () => {
    expect(tooltipPosition({left: 950, width: 40}, 200, 1000)).to.deep.eq({left: 792, noseX: 178});
  });

  it('keeps the nose out of the rounded corner', () => {
    expect(tooltipPosition({left: 0, width: 4}, 200, 1000).noseX).to.eq(14);
  });
});
