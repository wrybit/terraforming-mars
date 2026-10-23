import {expect} from 'chai';
import {alignToClock, AMBIENT_FRAMES_PER_SECOND} from '@/client/utils/ambientMotion';

type TimingUpdate = Parameters<AnimationEffect['updateTiming']>[0];

const TICK = 1000 / AMBIENT_FRAMES_PER_SECOND;

// Minimal stand-in for a Web Animation: only what alignToClock reads and writes
function fakeAnimation(startTime: number | null, duration: number, delay = 0) {
  const updates: Array<TimingUpdate> = [];
  const effect = {
    getComputedTiming: () => ({duration, delay}),
    updateTiming: (timing: TimingUpdate) => updates.push(timing),
  };
  const animation = {effect, startTime, pending: false, ready: Promise.resolve()};
  return {animation: animation as unknown as Animation, updates};
}

describe('ambientMotion', () => {
  it('steps the iteration in whole ticks', () => {
    const {animation, updates} = fakeAnimation(0, 2000);
    alignToClock(animation);
    const steps = Math.round(2000 / TICK);
    expect(updates).to.deep.eq([{duration: steps * TICK, easing: `steps(${steps}, jump-start)`}]);
  });

  it('tunes the timing only once per animation', () => {
    const {animation, updates} = fakeAnimation(0, 1500);
    alignToClock(animation);
    alignToClock(animation);
    expect(updates).to.have.length(1);
  });

  it('puts start time plus delay on the tick grid', () => {
    const {animation} = fakeAnimation(1000.4, 3000, 250);
    alignToClock(animation);
    const aligned = Number(animation.startTime) + 250;
    expect(Math.abs(aligned / TICK - Math.round(aligned / TICK))).to.be.lessThan(1e-9);
  });

  it('leaves a not yet started animation alone', () => {
    const {animation} = fakeAnimation(null, 3000);
    alignToClock(animation);
    expect(animation.startTime).to.eq(null);
  });
});
