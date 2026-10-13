import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardDiskBar from '@/client/components/admin/dashboard/DashboardDiskBar.vue';
import {diskSegments} from '@/client/components/admin/dashboard/diskSegments';

const GB = 1024 ** 3;

describe('DashboardDiskBar', () => {
  it('splits the used space by purpose; the rest of the used space is system and other', () => {
    const disk = {totalBytes: 100 * GB, freeBytes: 60 * GB, usage: {measuredAtMs: 0, docker: 10 * GB, game: 2 * GB, gameData: GB, logs: GB, aiLogs: 0}};
    expect(diskSegments(disk).map((segment) => [segment.key, segment.bytes / GB])).deep.eq([
      ['system', 26], ['docker', 10], ['game', 2], ['gameData', 1], ['logs', 1], ['free', 60],
    ]);
  });

  it('shows the parts in the bar and the legend in the same order', () => {
    const disk = {totalBytes: 100 * GB, freeBytes: 50 * GB, usage: {measuredAtMs: 0, gameData: 5 * GB}};
    const wrapper = mount(DashboardDiskBar, {...globalConfig, props: {disk}});
    expect(wrapper.findAll('.dashboard-disk-segment').map((segment) => segment.attributes('style'))).deep.eq(['width: 45%;', 'width: 5%;', 'width: 50%;']);
    expect(wrapper.findAll('dt').map((term) => term.text())).deep.eq(['System and other', 'Saved games', 'Free']);
    // Without an outside measurement there is no measuring time
    expect(wrapper.find('.dashboard-disk-note').exists()).is.false;
  });
});
