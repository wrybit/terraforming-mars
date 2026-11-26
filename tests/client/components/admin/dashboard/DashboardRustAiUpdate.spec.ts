import {mount, flushPromises} from '@vue/test-utils';
import {expect} from 'chai';
import {afterEach, vi} from 'vitest';
import {globalConfig} from '../../getLocalVue';
import DashboardRustAiUpdate from '@/client/components/admin/dashboard/DashboardRustAiUpdate.vue';
import {RustAiUpdateStatus} from '@/common/ai/rustAiUpdate';

function answer(status: RustAiUpdateStatus) {
  return Promise.resolve(new Response(JSON.stringify(status), {status: 200}));
}

describe('DashboardRustAiUpdate', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows a waiting version with an install button, which installs it', async () => {
    const fetchMock = vi.fn()
      .mockReturnValueOnce(answer({state: 'available', installed: '1.10', available: '1.11'}))
      .mockReturnValueOnce(answer({state: 'updated', installed: '1.11', available: '1.11'}));
    vi.stubGlobal('fetch', fetchMock);
    const wrapper = mount(DashboardRustAiUpdate, {...globalConfig});
    await flushPromises();
    expect(wrapper.find('.server-dashboard-deploy-status').text()).eq('Rust AI 1.11 is available');
    await wrapper.find('button').trigger('click');
    await flushPromises();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).deep.eq({install: true});
    expect(wrapper.find('.server-dashboard-deploy-status').text()).eq('Updated to version 1.11');
    expect(wrapper.find('button').exists()).is.false;
  });

  it('shows nothing while the Rust AI is up to date', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(answer({state: 'up-to-date', installed: '1.11', available: '1.11'})));
    const wrapper = mount(DashboardRustAiUpdate, {...globalConfig});
    await flushPromises();
    expect(wrapper.find('.server-dashboard-update').exists()).is.false;
  });
});
