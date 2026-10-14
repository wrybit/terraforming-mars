import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import LogFilterBar from '@/client/components/logpanel/LogFilterBar.vue';
import {aiInsightsShown, setAiInsightsShown} from '@/client/components/logpanel/aiAnalysis/aiInsightVisibility';

describe('AI info switch in the log filter', () => {
  afterEach(() => setAiInsightsShown(true));

  it('switches the AI info off and shows that as a chip', async () => {
    const wrapper = mount(LogFilterBar, {...globalConfig, props: {modelValue: {options: [], text: ''}, players: [], aiInsights: true}});
    await wrapper.find('.log-filter-toggle').trigger('click');
    await wrapper.find('[data-test="log-filter-ai"]').trigger('click');
    expect(aiInsightsShown.value).is.false;
    expect(wrapper.find('[data-test="log-filter-ai-off"]').exists()).is.true;
    await wrapper.find('[data-test="log-filter-ai-off"] .log-filter-chip-remove').trigger('click');
    expect(aiInsightsShown.value).is.true;
  });

  it('offers no switch outside analysis games', async () => {
    const wrapper = mount(LogFilterBar, {...globalConfig, props: {modelValue: {options: [], text: ''}, players: []}});
    await wrapper.find('.log-filter-toggle').trigger('click');
    expect(wrapper.find('[data-test="log-filter-ai"]').exists()).is.false;
  });
});
