import {mount, flushPromises} from '@vue/test-utils';
import {expect} from 'chai';
import {afterEach, vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import RustAiUpdate from '@/client/components/admin/RustAiUpdate.vue';
import {RustAiUpdateStatus} from '@/common/ai/rustAiUpdate';

function answer(status: RustAiUpdateStatus) {
  return Promise.resolve(new Response(JSON.stringify(status), {status: 200}));
}

describe('RustAiUpdate', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows a newer version with an install button, which installs it', async () => {
    const fetchMock = vi.fn()
      .mockReturnValueOnce(answer({state: 'available', installed: '1.10', available: '1.11', checkedAt: '2026-11-26T08:00:00Z'}))
      .mockReturnValueOnce(answer({state: 'updated', installed: '1.11', available: '1.11', checkedAt: '2026-11-26T08:01:00Z'}));
    vi.stubGlobal('fetch', fetchMock);
    const wrapper = mount(RustAiUpdate, {...globalConfig});
    await flushPromises();
    expect(wrapper.find('.rust-ai-update-text').text()).eq('Version 1.11 is available');
    const buttons = wrapper.findAll('button');
    expect(buttons).has.length(2);
    await buttons[1].trigger('click');
    await flushPromises();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).deep.eq({install: true});
    expect(wrapper.find('.rust-ai-update-text').text()).eq('Updated to version 1.11');
    expect(wrapper.findAll('button')).has.length(1);
  });

  it('stays hidden without an installed Rust AI', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(answer({state: 'not-installed'})));
    const wrapper = mount(RustAiUpdate, {...globalConfig});
    await flushPromises();
    expect(wrapper.find('.rust-ai-update').exists()).is.false;
  });

  it('marks a read-only bot folder as a problem', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(answer({state: 'read-only', installed: '1.10', available: '1.11'})));
    const wrapper = mount(RustAiUpdate, {...globalConfig});
    await flushPromises();
    expect(wrapper.find('.rust-ai-update-text--problem').text()).contains('read-only');
  });
});
