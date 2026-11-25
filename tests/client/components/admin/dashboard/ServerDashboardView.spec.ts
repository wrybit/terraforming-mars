import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import ServerDashboardView from '@/client/components/admin/dashboard/ServerDashboardView.vue';
import {ServerDashboard} from '@/common/admin/ServerDashboard';
import {DASHBOARD_SECTIONS, DashboardSectionData} from '@/common/admin/dashboardSections';

// Every part with the whole answer: each card reads only its own values from it
function allParts(dashboard: ServerDashboard): Partial<DashboardSectionData> {
  return Object.fromEntries(DASHBOARD_SECTIONS.map((section) => [section, dashboard]));
}

describe('ServerDashboardView', () => {
  it('lists graphics adapters and swap when the machine has them', () => {
    const dashboard = {
      identity: {name: 'AK1', imageUrl: 'api/admin/server-logo?file=logo-0123456789abcdef.webp'},
      host: {hostname: 'mc-pc', operatingSystem: 'Linux Mint 22.3', architecture: 'x64', nodeVersion: 'v22.0.0', systemUptimeSeconds: 60, serverUptimeSeconds: 60},
      cpu: {model: 'Celeron N5105', cores: 4, loadAverage: [1, 1, 1], usagePercent: 50, temperatureCelsius: 48.5},
      memory: {totalBytes: 16, availableBytes: 8, freeBytes: 4, swapTotalBytes: 2, swapFreeBytes: 1, serverProcessBytes: 1},
      gpus: [{name: 'Intel UHD Graphics (Jasper Lake)', driver: 'i915', kind: 'integrated', busyPercent: 7, clockMhz: {current: 200, max: 800}}],
      games: {running: 0, finished: 0},
      playersOnline: 0,
      activity: {days: [], weeks: []},
      presence: [],
      availability: [{start: '2026-10-13', value: 99.5}],
      serverStarts: [],
      reachability: {url: 'http://localhost/api/status', ok: true, statusCode: 200, latencyMs: 12},
      build: {head: 'abc', builtAt: 'n/a'},
      commits: [],
    } as ServerDashboard;
    const wrapper = mount(ServerDashboardView, {...globalConfig, props: {parts: allParts(dashboard)}});
    expect(wrapper.text()).contains('Intel UHD Graphics (Jasper Lake)');
    expect(wrapper.text()).contains('200 / 800 MHz');
    expect(wrapper.text()).contains('48.5 °C');
    expect(wrapper.text()).contains('Reachable (12 ms)');
    // Processor without area measurement, swap and graphics load as meters, memory as a split bar
    expect(wrapper.findAll('.dashboard-meter')).has.length(3);
    expect(wrapper.findAll('.dashboard-split')).has.length(1);
    // Name and logo large at the top of the server card
    expect(wrapper.find('.server-dashboard-logo-name').text()).eq('AK1');
    expect(wrapper.find('.server-dashboard-logo-image').attributes('src')).eq('api/admin/server-logo?file=logo-0123456789abcdef.webp');
  });

  it('shows a spinner in the cards whose parts are missing and the values in the others', () => {
    const wrapper = mount(ServerDashboardView, {...globalConfig, props: {parts: {history: {presence: [], availability: [], serverStarts: []}}}});
    // Availability and time of day are there, the nine other cards wait
    expect(wrapper.findAll('.dashboard-card--loading')).has.length(9);
    expect(wrapper.findAll('.loading-spinner')).has.length(9);
    expect(wrapper.text()).contains('First values after one minute of running');
  });

  it('says why a card has no values when its part failed', () => {
    const wrapper = mount(ServerDashboardView, {...globalConfig, props: {parts: {}, errors: {games: 'HTTP 502'}}});
    expect(wrapper.findAll('.dashboard-card-error')).has.length(3);
    expect(wrapper.find('.dashboard-card-error').text()).contains('HTTP 502');
  });
});
