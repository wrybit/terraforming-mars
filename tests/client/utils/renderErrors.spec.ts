import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../components/getLocalVue';
import {handleRenderError, renderErrorOccurred} from '@/client/utils/renderErrors';
import RenderErrorBanner from '@/client/components/common/RenderErrorBanner.vue';

describe('renderErrors', () => {
  afterEach(() => {
    renderErrorOccurred.value = false;
  });

  it('shows the reload notice only after a display error', async () => {
    const wrapper = mount(RenderErrorBanner, {...globalConfig});
    expect(wrapper.find('[data-test="render-error-banner"]').exists()).is.false;
    const error = console.error;
    console.error = () => {};
    try {
      handleRenderError(new Error('boom'), null, 'render function');
    } finally {
      console.error = error;
    }
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="render-error-banner"]').exists()).is.true;
  });
});
