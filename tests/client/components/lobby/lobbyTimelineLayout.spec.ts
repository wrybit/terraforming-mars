import {expect} from 'chai';
import {layoutTimeline, TIMELINE_GAP} from '@/client/components/lobby/lobbyTimelineLayout';

describe('lobbyTimelineLayout', () => {
  it('shares the width by duration when every segment is above its minimum', () => {
    const segments = layoutTimeline([1, 3], [10, 10], 400 + TIMELINE_GAP);
    expect(segments.map((segment) => segment.width)).deep.eq([100, 300]);
    expect(segments[1].left).eq(100 + TIMELINE_GAP);
  });

  it('keeps short generations at their minimum, the long one stops growing', () => {
    // 15 h against a few minutes: before, the short generations collapsed to nothing
    const weights = [60_000, 120_000, 90_000, 54_000_000];
    const segments = layoutTimeline(weights, [26, 26, 40, 26], 600);
    expect(segments.slice(0, 3).map((segment) => segment.width)).deep.eq([26, 26, 40]);
    const last = segments[3];
    expect(last.left + last.width).closeTo(600, 0.001);
  });

  it('never leaves a segment below its minimum and always fills the track exactly', () => {
    const weights = [5, 1_000, 2, 2, 3_000, 1];
    const minimums = [26, 26, 50, 26, 26, 30];
    const segments = layoutTimeline(weights, minimums, 500);
    segments.forEach((segment, index) => expect(segment.width).gte(minimums[index] - 0.001));
    const last = segments[segments.length - 1];
    expect(last.left + last.width).closeTo(500, 0.001);
  });

  it('falls back to the smaller minimums when the first ones do not fit', () => {
    const segments = layoutTimeline([1, 1, 100], [40, 40, 40], 100, [10, 30, 10]);
    expect(segments[0].width).gte(10);
    expect(segments[1].width).gte(30);
    expect(segments[2].left + segments[2].width).closeTo(100, 0.001);
  });

  it('shrinks all minimums alike when not even they fit', () => {
    const segments = layoutTimeline([1, 1, 1, 1], [40, 40, 40, 40], 100 + 3 * TIMELINE_GAP);
    expect(segments.map((segment) => segment.width)).deep.eq([25, 25, 25, 25]);
  });
});
