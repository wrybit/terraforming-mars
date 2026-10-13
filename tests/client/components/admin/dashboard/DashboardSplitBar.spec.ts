import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardSplitBar from '@/client/components/admin/dashboard/DashboardSplitBar.vue';
import {cpuSegments, diskSegments, memorySegments} from '@/client/components/admin/dashboard/usageSegments';

const GB = 1024 ** 3;
const parts = (segments: ReadonlyArray<{kind: string, value: number}>, unit = GB) => segments.map((segment) => [segment.kind, Math.round(segment.value / unit * 10) / 10]);

describe('DashboardSplitBar', () => {
  it('splits the disk by purpose; the rest of the used space is system and other', () => {
    const disk = {totalBytes: 100 * GB, freeBytes: 60 * GB, usage: {measuredAtMs: 0, docker: 10 * GB, game: 2 * GB, gameData: GB, logs: GB, aiLogs: 0}};
    expect(parts(diskSegments(disk))).deep.eq([['system', 26], ['docker', 10], ['game', 2], ['gameData', 1], ['logs', 1], ['free', 60]]);
  });

  it('splits memory into areas, system rest, cache and free', () => {
    const memory = {totalBytes: 24 * GB, availableBytes: 15 * GB, freeBytes: 10 * GB, swapTotalBytes: 0, swapFreeBytes: 0, serverProcessBytes: GB / 5};
    const usage = {measuredAtMs: 0, cpuPercent: {}, memoryBytes: {game: GB / 10, ai: GB, reserve: 6 * GB, system: GB / 5}};
    // Used 9 GB: areas 7.1 GB, the system takes the remaining 1.9 GB
    expect(parts(memorySegments(memory, usage))).deep.eq([['game', 0.1], ['ai', 1], ['reserve', 6], ['system', 1.9], ['cache', 5], ['free', 10]]);
    // Without a measurement only the game server process is known
    expect(parts(memorySegments(memory, undefined))).deep.eq([['game', 0.2], ['system', 8.8], ['cache', 5], ['free', 10]]);
  });

  it('splits the processor into areas and idle time', () => {
    expect(parts(cpuSegments({measuredAtMs: 0, cpuPercent: {ai: 86.1, game: 0.1, system: 0.1, programs: 1.5}, memoryBytes: {}}), 1))
      .deep.eq([['game', 0.1], ['ai', 86.1], ['programs', 1.5], ['system', 0.1], ['free', 12.2]]);
  });

  it('shows the parts in the bar and the legend in the same order, the used share on top', () => {
    const segments = diskSegments({totalBytes: 100 * GB, freeBytes: 50 * GB, usage: {measuredAtMs: 0, gameData: 5 * GB}});
    const wrapper = mount(DashboardSplitBar, {...globalConfig, props: {label: 'Disk', segments, total: 100 * GB}});
    expect(wrapper.findAll('.dashboard-split-segment').map((segment) => segment.attributes('style'))).deep.eq(['width: 45%;', 'width: 5%;', 'width: 50%;']);
    expect(wrapper.findAll('dt').map((term) => term.text())).deep.eq(['System and other', 'Saved games', 'Free']);
    expect(wrapper.find('.dashboard-meter-numbers').text()).eq('50.0 GB of 100.0 GB (50 %)');
    expect(wrapper.find('.dashboard-split-note').exists()).is.false;
  });
});
