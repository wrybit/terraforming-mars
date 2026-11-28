import {expect} from 'chai';
import {isLowEndHardware, slowFrameShare} from '@/client/utils/slowDevice';

describe('slowDevice', () => {
  it('trusts the hardware only where the browser reports memory (Chromium)', () => {
    expect(isLowEndHardware({deviceMemory: 2, hardwareConcurrency: 8})).is.true;
    expect(isLowEndHardware({deviceMemory: 4, hardwareConcurrency: 8})).is.true;
    expect(isLowEndHardware({deviceMemory: 8, hardwareConcurrency: 4})).is.true;
    expect(isLowEndHardware({deviceMemory: 8, hardwareConcurrency: 8})).is.false;
    // Safari: no memory, cores clamped to 4 on every iPhone, so no verdict from hardware
    expect(isLowEndHardware({hardwareConcurrency: 4})).is.false;
  });

  it('counts frames slower than 30 per second', () => {
    expect(slowFrameShare([])).to.eq(0);
    expect(slowFrameShare([16, 17, 16, 50])).to.eq(0.25);
    expect(slowFrameShare([40, 50, 16, 16])).to.eq(0.5);
  });
});
