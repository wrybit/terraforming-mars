import {expect} from 'chai';
import {LoginThrottle} from '../../../src/server/server/auth/LoginThrottle';

describe('LoginThrottle', () => {
  const DAY = 24 * 60 * 60 * 1000;
  let throttle: LoginThrottle;

  beforeEach(() => {
    throttle = new LoginThrottle({freeFailures: 0, baseDelayMs: 1000, maxDelayMs: 8000, forgetAfterMs: DAY});
  });

  it('doubles the lock up to the maximum', () => {
    const locks = [1, 2, 3, 4, 5].map(() => throttle.recordFailure('a', 0));
    expect(locks).deep.eq([1000, 2000, 4000, 8000, 8000]);
  });

  it('reports the remaining lock', () => {
    throttle.recordFailure('a', 0);
    expect(throttle.remainingLockMs('a', 400)).eq(600);
    expect(throttle.remainingLockMs('a', 1000)).eq(0);
    expect(throttle.remainingLockMs('b', 400)).eq(0);
  });

  it('free failures cost nothing', () => {
    const free = new LoginThrottle({freeFailures: 2, baseDelayMs: 1000, maxDelayMs: 8000, forgetAfterMs: DAY});
    expect([1, 2, 3].map(() => free.recordFailure('a', 0))).deep.eq([0, 0, 1000]);
  });

  it('forgets a key after a quiet day', () => {
    throttle.recordFailure('a', 0);
    throttle.recordFailure('a', 0);
    expect(throttle.recordFailure('a', DAY)).eq(1000);
  });

  it('a success forgets the failures', () => {
    throttle.recordFailure('a', 0);
    throttle.recordSuccess('a');
    expect(throttle.remainingLockMs('a', 0)).eq(0);
    expect(throttle.recordFailure('a', 0)).eq(1000);
  });

  it('keeps counting a key during a flood of other keys', () => {
    throttle.recordFailure('a', 0);
    for (let i = 0; i < 1500; i++) {
      throttle.recordFailure('flood' + i, 10);
    }
    expect(throttle.recordFailure('a', 10)).eq(2000);
  });
});
