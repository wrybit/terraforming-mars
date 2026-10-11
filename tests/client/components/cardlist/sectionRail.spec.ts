import {expect} from 'chai';
import {activeSectionIndex, fisheyeInfluence, RAIL_TICK_SPACING} from '@/client/components/cardlist/sectionRail';

describe('sectionRail', () => {
  it('magnifies most at the centre and fades out about two ticks away', () => {
    expect(fisheyeInfluence(0)).eq(1);
    expect(fisheyeInfluence(RAIL_TICK_SPACING)).to.be.within(0.4, 0.6);
    expect(fisheyeInfluence(3 * RAIL_TICK_SPACING)).to.be.below(0.01);
  });

  it('the section being read is the last one that reached the sticky line', () => {
    expect(activeSectionIndex([80, 900, 2000], 82)).eq(0);
    expect(activeSectionIndex([-3000, 82, 900], 82)).eq(1);
    expect(activeSectionIndex([-3000, -100, 50], 82)).eq(2);
    expect(activeSectionIndex([200, 900], 82)).eq(0);
  });
});
