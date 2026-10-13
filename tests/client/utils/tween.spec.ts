import {expect} from 'chai';
import {vi} from 'vitest';
import {TWEEN_DURATION_MS, tween} from '@/client/utils/tween';

type FrameCallback = (time: number) => void;

describe('tween', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('jumps at once when there is nothing to animate', () => {
    const values: Array<number> = [];
    let done = false;
    tween(5, 5, (value) => values.push(value), () => done = true);
    expect(values).deep.eq([5]);
    expect(done).is.true;
  });

  it('runs frame by frame from start to end', () => {
    const frames: Array<FrameCallback> = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameCallback) => frames.push(callback));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const values: Array<number> = [];
    let done = false;
    tween(0, 100, (value) => values.push(value), () => done = true);
    for (const time of [0, TWEEN_DURATION_MS / 2, TWEEN_DURATION_MS]) {
      frames.shift()?.(time);
    }
    expect(values[0]).eq(0);
    expect(values[1]).to.be.within(50, 100); // eases out: more than half way at half time
    expect(values[2]).eq(100);
    expect(done).is.true;
  });

  it('stops when cancelled', () => {
    const frames: Array<FrameCallback> = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameCallback) => frames.push(callback));
    vi.stubGlobal('cancelAnimationFrame', () => frames.splice(0));
    let done = false;
    const stop = tween(0, 100, () => {}, () => done = true);
    stop();
    expect(frames).is.empty;
    expect(done).is.false;
  });
});
