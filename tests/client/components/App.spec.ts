import {flushPromises, shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {beforeAll, vi} from 'vitest';
import {globalConfig} from '@tests/client/components/getLocalVue';
import App from '@/client/components/App.vue';

// The start screen loads several large chunks (planet assets, i18n, …) after the mount. Stub it so the
// smoke test only checks App itself and no chunk can resolve after Vitest tore the environment down.
vi.mock('@/client/components/StartScreen.vue', () => ({
  default: {name: 'StartScreen', render: () => null},
}));

describe('App', () => {
  // App loads the start screen as an async chunk. Loaded here first, so its imports do not finish only after the
  // test environment is torn down (vitest then reports an unhandled "Cannot load …" error and fails the run).
  beforeAll(async () => {
    await import('@/client/components/StartScreen.vue');
    await import('@/client/components/StartScreenFooter.vue');
  });

  it('mounts without errors', async () => {
    const wrapper = shallowMount(App, globalConfig);
    expect(wrapper.exists()).to.be.true;
    await flushPromises();
    wrapper.unmount();
  });
});
