import {expect} from 'chai';
import {clampHeight} from '@/client/utils/rowResize';
import {distanceToRect, proximity, PROXIMITY_RADIUS} from '@/client/utils/handleProximity';

describe('rowResize', () => {
  it('clamps and rounds heights to the limits', () => {
    expect(clampHeight(50, {min: 100, max: 300})).to.eq(100);
    expect(clampHeight(500, {min: 100, max: 300})).to.eq(300);
    expect(clampHeight(200.4, {min: 100, max: 300})).to.eq(200);
  });
});

describe('handleProximity', () => {
  const rect = {left: 100, right: 112, top: 0, bottom: 500};

  it('measures the distance to the handle', () => {
    expect(distanceToRect(106, 250, rect)).to.eq(0);
    expect(distanceToRect(150, 250, rect)).to.eq(38);
    expect(distanceToRect(100, 504, rect)).to.eq(4);
  });

  it('fades in linearly towards the handle', () => {
    expect(proximity(0)).to.eq(1);
    expect(proximity(PROXIMITY_RADIUS / 2)).to.eq(0.5);
    expect(proximity(PROXIMITY_RADIUS * 2)).to.eq(0);
  });
});
