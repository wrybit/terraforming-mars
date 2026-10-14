import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import LogAiRatings from '@/client/components/logpanel/aiAnalysis/LogAiRatings.vue';

describe('LogAiRatings', () => {
  it('renders nothing without ratings', () => {
    const wrapper = shallowMount(LogAiRatings, {...globalConfig, props: {entries: []}});
    expect(wrapper.find('[data-test="log-ai-ratings"]').exists()).is.false;
  });

  it('shows emoji, name and comment', () => {
    const wrapper = shallowMount(LogAiRatings, {...globalConfig, props: {entries: [
      {messageId: '1.a', color: 'red', name: 'Jens', rating: 'down', text: 'too greedy', at: 1},
    ]}});
    expect(wrapper.text()).contains('👎');
    expect(wrapper.text()).contains('Jens');
    expect(wrapper.text()).contains('too greedy');
  });
});
