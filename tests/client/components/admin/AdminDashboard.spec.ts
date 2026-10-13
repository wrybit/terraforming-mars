import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import AdminDashboard from '@/client/components/admin/AdminDashboard.vue';
import {ServerDashboard} from '@/common/admin/ServerDashboard';
import {formatBytes, formatDuration, percent} from '@/client/components/admin/dashboard/dashboardFormat';

const GB = 1024 ** 3;

const dashboard: ServerDashboard = {
  generatedAtMs: 0,
  identity: {name: 'tm-server'},
  host: {hostname: 'tm-server', operatingSystem: 'Ubuntu 24.04', architecture: 'arm64', nodeVersion: 'v22.0.0', systemUptimeSeconds: 90000, serverUptimeSeconds: 600},
  cpu: {model: 'Neoverse-N1', cores: 4, loadAverage: [0.5, 0.4, 0.3], usagePercent: 12.5},
  memory: {totalBytes: 24 * GB, availableBytes: 20 * GB, freeBytes: 18 * GB, swapTotalBytes: 0, swapFreeBytes: 0, serverProcessBytes: GB / 4},
  disk: {totalBytes: 96 * GB, freeBytes: 6 * GB, usage: {measuredAtMs: 0, docker: 20 * GB, game: 2 * GB, gameData: GB, logs: GB / 10, aiLogs: GB / 10}},
  gpus: [],
  games: {running: 3, finished: 67, playersOnline: 2},
  activity: {days: [{start: '2026-10-13', value: 4}], weeks: [{start: '2026-10-12', value: 5}]},
  presence: [{start: '2026-10-13', slots: Array(288).fill(1)}],
  availability: [],
  serverStarts: ['2026-10-13T08:00:00.000Z'],
  reachability: {url: 'https://tm.example.org/api/status', ok: false, error: 'fetch failed'},
  build: {head: 'ffaec1b', builtAt: 'Tue, 13 Oct 2026 10:04:51 +0200'},
  commits: [{hash: 'ffaec1b', time: '2026-10-13T09:50:00+02:00', title: 'Fix sign of card resource'}],
};

describe('AdminDashboard', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = (url) => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(String(url) === 'api/admin/session' ? {admin: true} : dashboard),
    } as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows machine values, a full disk in red, the public address problem and the commits', async () => {
    const wrapper = mount(AdminDashboard, {...globalConfig});
    for (let tick = 0; tick < 4; tick++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(wrapper.text()).contains('tm-server');
    expect(wrapper.text()).contains('Not reachable');
    expect(wrapper.findAll('.dashboard-split .dashboard-tone--critical')).has.length(1);
    expect(wrapper.findAll('.dashboard-split-bar .dashboard-split-segment--gameData')).has.length(1);
    expect(wrapper.find('.server-dashboard-commits').text()).contains('Fix sign of card resource');
    expect(wrapper.text()).contains('No graphics adapter found');
  });

  it('formats bytes, durations and shares', () => {
    expect(formatBytes(1.5 * GB)).eq('1.5 GB');
    expect(formatBytes(85 * 1024 ** 2)).eq('85.0 MB');
    expect(formatDuration(90000)).eq('1 d 1 h');
    expect(formatDuration(3720)).eq('1 h 2 min');
    expect(formatDuration(59)).eq('0 min');
    expect(percent(1, 3)).eq(33);
    expect(percent(1, 0)).eq(0);
  });
});
