import {expect} from 'chai';
import {resolveMobileLayout} from '@/client/utils/mobileLayout';
import {cardColumns, fitScale} from '@/client/utils/mobileFit';

describe('mobileLayout', () => {
  it('uses touch devices and narrow windows in auto mode and honours overrides', () => {
    expect(resolveMobileLayout('auto', true, false)).to.be.true;
    expect(resolveMobileLayout('auto', false, true)).to.be.true;
    expect(resolveMobileLayout('auto', false, false)).to.be.false;
    expect(resolveMobileLayout('on', false, false)).to.be.true;
    expect(resolveMobileLayout('off', true, true)).to.be.false;
  });
});

describe('mobileFit', () => {
  it('picks 2 columns on phones, 3 on tablets in portrait, 4 in landscape', () => {
    expect(cardColumns(374)).to.eq(2);
    expect(cardColumns(788)).to.eq(3);
    expect(cardColumns(1334)).to.eq(4);
  });

  it('scales items to fit the columns, never enlarging them', () => {
    expect(fitScale(374, 250, 2)).to.be.closeTo(0.724, 0.001);
    expect(fitScale(2000, 250, 2)).to.eq(1);
    expect(fitScale(374, 0, 2)).to.eq(1);
  });
});
