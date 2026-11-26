import {flushPromises, mount} from '@vue/test-utils';
import {expect} from 'chai';
import {vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import AdminAi from '@/client/components/admin/AdminAi.vue';

// The live load and the AI overview fetch on their own, not part of these tests
const aiStubs = {global: {...globalConfig.global, stubs: {...globalConfig.global.stubs, AiLoadGraph: true, AiSupportOverview: true}}};

describe('AdminAi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is a page of its own in the admin menu, without the settings tabs', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) =>
      new Response(JSON.stringify(url.includes('session') ? {admin: true} : url.includes('settings') ? {settings: []} : {}), {status: 200})));
    const wrapper = mount(AdminAi, aiStubs);
    await flushPromises();
    expect(wrapper.find('.admin-nav-link--active').text()).eq('AI opponents');
    expect(wrapper.find('.server-settings-tabs').exists()).is.false;
    wrapper.unmount();
  });
});
