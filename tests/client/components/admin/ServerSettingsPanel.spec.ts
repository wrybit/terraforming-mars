import {flushPromises, mount} from '@vue/test-utils';
import {expect} from 'chai';
import {vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import ServerSettingsPanel from '@/client/components/admin/ServerSettingsPanel.vue';
import {SERVER_SETTINGS} from '@/common/admin/serverSettings';

// The live load and the AI overview fetch on their own, not part of these tests
const aiStubs = {global: {...globalConfig.global, stubs: {...globalConfig.global.stubs, AiLoadGraph: true, AiSupportOverview: true}}};

describe('ServerSettingsPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the value that applies instead of a placeholder, a slider where it makes sense, and stores the default as no line', async () => {
    const requests: Array<Parameters<typeof fetch>[1]> = [];
    const settings = SERVER_SETTINGS.map(({key}) => ({key, value: undefined, running: undefined}));
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: Parameters<typeof fetch>[1]) => {
      requests.push(init);
      return new Response(JSON.stringify(url.includes('settings') ? {settings} : {}), {status: 200});
    }));
    const wrapper = mount(ServerSettingsPanel, {...globalConfig, attachTo: document.body});
    await flushPromises();
    // Limits tab: minimum time between inputs, default 0 with a slider 0–2000
    await wrapper.findAll('.or-tab').find((tab) => tab.text().includes('Limits'))!.trigger('click');
    const field = wrapper.find('#server-setting-MIN_RESPONSE_INTERVAL_MS');
    expect((field.element as HTMLInputElement).value).eq('0');
    expect(field.attributes('placeholder')).is.undefined;
    const slider = field.element.parentElement!.querySelector('.server-settings-slider') as HTMLInputElement;
    expect(slider.max).eq('2000');
    // Back to the default: nothing to save
    await field.setValue('500');
    expect(wrapper.find('.server-settings-actions .btn-tone-quiet').attributes('disabled')).is.undefined;
    await field.setValue('0');
    expect(wrapper.find('.server-settings-actions .btn-tone-quiet').attributes('disabled')).is.not.undefined;
    wrapper.unmount();
  });
  it('settings: push is a tab, the AI opponents are not (own page); with "only" just that group without tabs', async () => {
    const settings = SERVER_SETTINGS.map(({key}) => ({key, value: undefined, running: undefined}));
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(url.includes('settings') ? {settings} : {}), {status: 200})));
    const wrapper = mount(ServerSettingsPanel, {...globalConfig, props: {initialTab: 'Push'}});
    await flushPromises();
    const tabs = wrapper.findAll('.or-tab').map((tab) => tab.text());
    expect(tabs).contains('Push');
    expect(tabs).not.contains('AI opponents');
    expect(wrapper.find('.or-tab--active').text()).eq('Push');
    expect(wrapper.find('#admin-push').exists()).is.true;
    expect(wrapper.find('.server-settings-actions').exists()).is.false;
    wrapper.unmount();

    const aiPage = mount(ServerSettingsPanel, {...aiStubs, props: {only: 'AI opponents'}});
    await flushPromises();
    expect(aiPage.find('.or-tabs').exists()).is.false;
    expect(aiPage.find('#server-setting-AI_RUST_EXTRA_WAIT_MS').exists()).is.true;
    aiPage.unmount();
  });
});
