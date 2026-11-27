import {expect} from 'chai';
import {SHAKE_PAUSE_MS, ShakeDetector} from '@/client/components/feedback/feedbackShake';

describe('feedbackShake', () => {
  // Phone lying still: only gravity
  const still = (detector: ShakeDetector, time: number) => detector.sample(0, 0, 9.81, time);
  const jolt = (detector: ShakeDetector, time: number) => detector.sample(20, 15, 9.81, time);

  it('needs three strong jolts within a second', () => {
    const detector = new ShakeDetector();
    expect(still(detector, 0)).is.false;
    expect(jolt(detector, 100)).is.false;
    expect(jolt(detector, 300)).is.false;
    expect(jolt(detector, 500)).is.true;
  });

  it('ignores jolts spread over a longer time', () => {
    const detector = new ShakeDetector();
    expect(jolt(detector, 0)).is.false;
    expect(jolt(detector, 900)).is.false;
    expect(jolt(detector, 1950)).is.false;
  });

  it('pauses after a shake', () => {
    const detector = new ShakeDetector();
    [0, 100, 200].forEach((time) => jolt(detector, time));
    expect([300, 400, 500].map((time) => jolt(detector, time))).not.include(true);
    const later = 200 + SHAKE_PAUSE_MS;
    expect([later, later + 100, later + 200].map((time) => jolt(detector, time))).include(true);
  });
});
