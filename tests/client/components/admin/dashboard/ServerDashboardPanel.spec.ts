import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import ServerDashboardPanel from '@/client/components/admin/dashboard/ServerDashboardPanel.vue';

describe('ServerDashboardPanel', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = () => Promise.resolve({ok: false, status: 502} as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('offers to try again when the server does not answer', async () => {
    const wrapper = mount(ServerDashboardPanel, {...globalConfig});
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.text()).contains('Try again');
  });

  it('fills each card as soon as its own part arrives', async () => {
    const history = {presence: [], availability: [{start: '2026-10-13', value: 99}], serverStarts: []};
    // The saved games never answer here: only their cards keep spinning
    global.fetch = (url) => String(url).endsWith('/history') ?
      Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(history)} as Response) :
      new Promise<Response>(() => {});
    const wrapper = mount(ServerDashboardPanel, {...globalConfig});
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.findAll('.dashboard-card--loading')).has.length(9);
    expect(wrapper.text()).not.contains('Try again');
    wrapper.unmount();
  });
});

