import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import ServerDashboardView from '@/client/components/admin/dashboard/ServerDashboardView.vue';
import {ServerDashboard} from '@/common/admin/ServerDashboard';

describe('ServerDashboardView', () => {
  it('lists graphics adapters and swap when the machine has them', () => {
    const dashboard = {
      generatedAtMs: 0,
      host: {hostname: 'mc-pc', operatingSystem: 'Linux Mint 22.3', architecture: 'x64', nodeVersion: 'v22.0.0', systemUptimeSeconds: 60, serverUptimeSeconds: 60},
      cpu: {model: 'Celeron N5105', cores: 4, loadAverage: [1, 1, 1], usagePercent: 50, temperatureCelsius: 48.5},
      memory: {totalBytes: 16, availableBytes: 8, freeBytes: 4, swapTotalBytes: 2, swapFreeBytes: 1, serverProcessBytes: 1},
      gpus: ['Intel 0x4e61'],
      games: {running: 0, finished: 0, playersOnline: 0},
      activity: {days: [], weeks: []},
      presence: [],
      availability: [{start: '2026-10-13', value: 99.5}],
      serverStarts: [],
      reachability: {url: 'http://localhost/api/status', ok: true, statusCode: 200, latencyMs: 12},
      build: {head: 'abc', builtAt: 'n/a'},
      commits: [],
    } as ServerDashboard;
    const wrapper = mount(ServerDashboardView, {...globalConfig, props: {dashboard}});
    expect(wrapper.text()).contains('Intel 0x4e61');
    expect(wrapper.text()).contains('48.5 °C');
    expect(wrapper.text()).contains('Reachable (12 ms)');
    // Processor without area measurement and swap as meters, memory as a split bar
    expect(wrapper.findAll('.dashboard-meter')).has.length(2);
    expect(wrapper.findAll('.dashboard-split')).has.length(1);
  });
});
