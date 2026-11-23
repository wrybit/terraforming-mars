import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import AiStrengthLabel from '@/client/components/admin/AiStrengthLabel.vue';

describe('AiStrengthLabel', () => {
  it('shows a strength like in the game: robot, name and marker', () => {
    const wrapper = mount(AiStrengthLabel, {...globalConfig, props: {column: 'hard'}});
    expect(wrapper.find('.seat-icon').exists()).is.true;
    expect(wrapper.text()).contains('Hard');
    expect(wrapper.find('.ai-strength-label-marker').text()).eq('[AI+]');
  });

  it('shows any other column as it is, without robot', () => {
    const wrapper = mount(AiStrengthLabel, {...globalConfig, props: {column: 'other'}});
    expect(wrapper.find('.seat-icon').exists()).is.false;
    expect(wrapper.text()).eq('other');
  });
});
