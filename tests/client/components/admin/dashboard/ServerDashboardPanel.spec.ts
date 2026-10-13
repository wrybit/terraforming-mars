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
});
