import {flushPromises, mount} from '@vue/test-utils';
import {expect} from 'chai';
import {vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import ServerSettingsPanel from '@/client/components/admin/ServerSettingsPanel.vue';
import {SERVER_SETTINGS} from '@/common/admin/serverSettings';

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
});
