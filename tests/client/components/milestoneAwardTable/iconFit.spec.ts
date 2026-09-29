import {expect} from 'chai';
import {iconZoom} from '@/client/components/milestoneAwardTable/iconFit';

describe('iconZoom', () => {
  it('never enlarges icons', () => {
    expect(iconZoom(36, 80)).to.eq(1);
  });

  it('shrinks an icon wider than its column', () => {
    expect(iconZoom(76, 42)).to.eq(0.5);
  });

  it('ignores icons without width (images not loaded yet)', () => {
    expect(iconZoom(0, 10)).to.eq(1);
  });
});
