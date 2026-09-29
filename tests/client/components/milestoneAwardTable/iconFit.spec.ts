import {expect} from 'chai';
import {iconZoom} from '@/client/components/milestoneAwardTable/iconFit';

describe('iconZoom', () => {
  it('never enlarges icons', () => {
    expect(iconZoom([{icon: 36, cell: 80}, {icon: 40, cell: 80}])).to.eq(1);
  });

  it('shrinks all icons by the factor of the tightest column', () => {
    expect(iconZoom([{icon: 36, cell: 80}, {icon: 76, cell: 42}])).to.eq(0.5);
  });

  it('ignores icons without width (images not loaded yet)', () => {
    expect(iconZoom([{icon: 0, cell: 10}])).to.eq(1);
  });
});
