import {expect} from 'chai';
import {LiveLoad, processTicks} from '../../../src/server/admin/dashboard/liveLoad';

describe('LiveLoad', () => {
  it('reads the processor ticks of a process, also with spaces in its name', () => {
    const stat = '4242 (tm bot) S 1 4242 4242 0 -1 4194560 100 0 0 0 250 50 0 0 20 0 9 0 12345 0 0';
    expect(processTicks(stat)).eq(300);
    expect(processTicks(undefined)).is.undefined;
  });

  it('measures every core and the machine on any platform', async () => {
    const sample = await new LiveLoad(new Set()).sample();
    expect(sample.cores).greaterThan(0);
    expect(sample.corePercent).has.length(sample.cores);
    expect(sample.cpu.totalPercent).within(0, 100);
    expect(sample.cpu.gameServerPercent).within(0, 100);
    expect(sample.memory.availableBytes).within(0, sample.memory.totalBytes);
    expect(sample.aiBots).eq(0);
  });

  it('measures the next time against the previous call without waiting', async () => {
    const liveLoad = new LiveLoad(new Set());
    await liveLoad.sample();
    const started = Date.now();
    await liveLoad.sample();
    expect(Date.now() - started).lessThan(200);
  });
});
