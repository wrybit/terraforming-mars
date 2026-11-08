import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import AdminPush from '@/client/components/admin/AdminPush.vue';
import {AdminPushInfo} from '@/common/admin/AdminPushModel';
import {PUSH_CATALOG} from '@/client/components/admin/push/pushCatalog';

describe('AdminPush', () => {
  let originalFetch: typeof global.fetch;
  const info: AdminPushInfo = {
    subscribers: 4,
    subscriptionMaxAgeDays: 30,
    deliveries: [{at: 0, kind: 'joined', roomId: 'ab12', roomTitle: 'Abend', participant: 'hostho', result: 'sent'}],
  };

  beforeEach(() => {
    originalFetch = global.fetch;
    // Logged in (api/admin/session), then the push info
    global.fetch = (url) => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(String(url) === 'api/admin/push' ? info : {admin: true}),
    } as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows every message of the catalog and the latest deliveries', async () => {
    const wrapper = mount(AdminPush, {...globalConfig});
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(wrapper.findAll('.push-event').map((card) => card.attributes('data-kind'))).deep.eq(PUSH_CATALOG.map((entry) => entry.kind));
    // The browser-only message offers no test
    expect(wrapper.findAll('.push-test')).has.length(3);
    expect(wrapper.findAll('.push-fact')).has.length(5);
    expect(wrapper.find('.push-fact strong').text()).eq('4');
    expect(wrapper.findAll('.push-deliveries-table tbody tr')).has.length(1);
  });

  it('marks the name parameter in the preview', async () => {
    const wrapper = mount(AdminPush, {...globalConfig});
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(wrapper.find('.push-event[data-kind=joined] .push-notification-title mark').text()).eq('Bob');
  });

  it('test message: without a service worker report it says the message did not arrive', async () => {
    global.fetch = (url, init) => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(init?.method === 'POST' ? {result: 'sent'} : String(url) === 'api/admin/push' ? info : {admin: true}),
    } as Response);
    const wrapper = mount(AdminPush, {...globalConfig});
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    await wrapper.find('.push-test').trigger('click');
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(wrapper.find('.push-test + p').text()).contains('did not reach this browser');
  });
});
