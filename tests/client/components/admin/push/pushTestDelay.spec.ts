import {expect} from 'chai';
import {clampDelay} from '@/client/components/admin/push/pushTestDelay';

describe('pushTestDelay', () => {
  it('keeps the delay between 1 and 60 whole seconds, unreadable values fall back to 5', () => {
    expect([clampDelay(0), clampDelay(12.4), clampDelay(99), clampDelay(Number('x'))]).deep.eq([1, 12, 60, 5]);
  });
});
