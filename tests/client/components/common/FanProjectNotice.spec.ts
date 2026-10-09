import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import FanProjectNotice from '@/client/components/common/FanProjectNotice.vue';

describe('FanProjectNotice', () => {
  it('shows title and text, inline by default', () => {
    const wrapper = mount(FanProjectNotice, globalConfig);
    expect(wrapper.text()).contains('Unofficial fan project');
    expect(wrapper.text()).contains('Not affiliated with FryxGames');
    expect(wrapper.find('.fan-project-notice--inline').exists()).is.true;
  });

  it('can stack title above the text', () => {
    const wrapper = mount(FanProjectNotice, {...globalConfig, props: {layout: 'stacked'}});
    expect(wrapper.find('.fan-project-notice--stacked').exists()).is.true;
  });
});
