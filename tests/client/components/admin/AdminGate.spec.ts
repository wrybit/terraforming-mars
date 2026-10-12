import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import AdminGate from '@/client/components/admin/AdminGate.vue';

// Answers of the fake server per request, in order
function fakeFetch(statuses: Array<number>, requests: Array<{url: string, method: string, body: string}>): typeof global.fetch {
  return (url, init) => {
    requests.push({url: String(url), method: init?.method ?? 'GET', body: String(init?.body)});
    const status = statuses.shift() ?? 200;
    return Promise.resolve({ok: status === 200, status, json: () => Promise.resolve({})} as Response);
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('AdminGate', () => {
  let originalFetch: typeof global.fetch;
  let requests: Array<{url: string, method: string, body: string}>;

  beforeEach(() => {
    originalFetch = global.fetch;
    requests = [];
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows the page right away when the browser is logged in', async () => {
    global.fetch = fakeFetch([200], requests);
    const wrapper = mount(AdminGate, {...globalConfig, props: {active: 'raw'}, slots: {default: '<p class="page">page</p>'}});
    await flush();
    expect(wrapper.find('.page').exists()).is.true;
    expect(wrapper.emitted('ready')).has.length(1);
    expect(wrapper.text()).contains('Log out');
  });

  it('asks for the passphrase, sends it in the body and then shows the page', async () => {
    global.fetch = fakeFetch([403, 200], requests);
    const wrapper = mount(AdminGate, {...globalConfig, props: {active: 'raw'}, slots: {default: '<p class="page">page</p>'}});
    await flush();
    expect(wrapper.find('.page').exists()).is.false;
    await wrapper.find('input').setValue('secret');
    await wrapper.find('form').trigger('submit');
    await flush();
    expect(requests[1]).deep.eq({url: 'api/admin/session', method: 'POST', body: '{"serverId":"secret"}'});
    expect(requests.every((request) => !request.url.includes('secret'))).is.true;
    expect(wrapper.find('.page').exists()).is.true;
  });

  it('says so when the passphrase is wrong', async () => {
    global.fetch = fakeFetch([403, 403], requests);
    const wrapper = mount(AdminGate, {...globalConfig, props: {active: 'raw'}});
    await flush();
    await wrapper.find('input').setValue('wrong');
    await wrapper.find('form').trigger('submit');
    await flush();
    expect(wrapper.text()).contains('does not seem to fit');
  });
});
