import {flushPromises, shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {beforeAll} from 'vitest';
import {globalConfig} from '@tests/client/components/getLocalVue';
import App from '@/client/components/App.vue';

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
    // Let the async screen components (StartScreen et al.) finish importing before the test environment is torn down.
    await flushPromises();
    wrapper.unmount();
  });
});
