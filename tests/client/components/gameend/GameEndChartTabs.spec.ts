import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import GameEndChartTabs from '@/client/components/gameend/GameEndChartTabs.vue';

describe('GameEndChartTabs', () => {
  const props = {
    victoryPointDatasets: [],
    globalParameterDatasets: [],
    generation: 5,
  };

  it('shows the victory point chart first', () => {
    const wrapper = shallowMount(GameEndChartTabs, {...globalConfig, props});
    const chart = wrapper.findComponent({name: 'VictoryPointChart'});
    expect(chart.props('id')).eq('victory-point-chart');
  });

  it('switches to the global parameter chart', async () => {
    const wrapper = shallowMount(GameEndChartTabs, {...globalConfig, props});
    await wrapper.find('[data-test="chart-tab-globalParameters"]').trigger('click');
    const chart = wrapper.findComponent({name: 'VictoryPointChart'});
    expect(chart.props('id')).eq('global-parameter-chart');
  });
});
