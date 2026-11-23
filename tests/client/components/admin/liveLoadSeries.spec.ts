import {expect} from 'chai';
import {LiveLoadSample} from '@/common/admin/LiveLoad';
import {LIVE_LOAD_WINDOW, liveMemorySegments, loadParts, sampleAt, stackedAreaPaths} from '@/client/components/admin/liveLoadSeries';

function sample(total: number, ai: number | undefined, game: number): LiveLoadSample {
  return {
    measuredAtMs: 0, cores: 4, processorModel: 'Test', corePercent: [total, total, total, total],
    cpu: {totalPercent: total, gameServerPercent: game, aiPercent: ai},
    memory: {totalBytes: 1000, availableBytes: 400, gameServerBytes: 100, aiBytes: ai === undefined ? undefined : 200},
    aiBots: 1,
  };
}

describe('liveLoadSeries', () => {
  it('splits the processor into AI, game server and the rest, never above the total', () => {
    expect(loadParts(sample(60, 40, 10))).deep.eq({ai: 40, game: 10, system: 10});
    expect(loadParts(sample(30, 25, 10)).system).eq(0);
    expect(loadParts(sample(30, undefined, 10))).deep.eq({ai: 0, game: 10, system: 20});
  });

  it('stacks the parts and puts the newest sample at the right edge', () => {
    const paths = stackedAreaPaths([sample(50, 50, 0), sample(100, 50, 50)], 590, 100);
    // AI from 0 up to 50 % at the right edge, the game server on top of it up to 100 %
    expect(paths.ai).contains('590,50');
    expect(paths.game).contains('590,0');
    expect(stackedAreaPaths([], 590, 100).ai).eq('');
  });

  it('finds the sample under the mouse, nothing left of a short history', () => {
    expect(sampleAt(1, 5)).eq(4);
    expect(sampleAt(0, LIVE_LOAD_WINDOW)).eq(0);
    expect(sampleAt(0, 5)).is.undefined;
  });

  it('splits the memory like the dashboard bar', () => {
    expect(liveMemorySegments(sample(10, 5, 1)).map((segment) => [segment.kind, segment.value])).deep.eq([
      ['ai', 200], ['game', 100], ['system', 300], ['free', 400],
    ]);
  });
});
