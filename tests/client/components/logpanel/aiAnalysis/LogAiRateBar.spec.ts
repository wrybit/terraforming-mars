import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import LogAiRateBar from '@/client/components/logpanel/aiAnalysis/LogAiRateBar.vue';

describe('LogAiRateBar', () => {
  it('offers thumbs up, thumbs down and flag, in this order', async () => {
    const wrapper = mount(LogAiRateBar, {...globalConfig, props: {left: 10, top: 20}});
    expect(wrapper.findAll('button').map((button) => button.text())).deep.eq(['👍', '👎', '⚠️']);
    await wrapper.find('[data-test="log-ai-rate-down"]').trigger('click');
    expect(wrapper.emitted('rate')).deep.eq([['down']]);
  });
});
