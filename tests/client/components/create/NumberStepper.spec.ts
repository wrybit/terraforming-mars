import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import NumberStepper from '@/client/components/create/NumberStepper.vue';

describe('NumberStepper', () => {
  it('steps within the limits', async () => {
    const wrapper = mount(NumberStepper, {...globalConfig, props: {modelValue: 9, min: 0, max: 10, step: 5}});
    const [minus, plus] = wrapper.findAll('button');
    await plus.trigger('click');
    await minus.trigger('click');
    expect(wrapper.emitted('update:modelValue')).deep.eq([[10], [4]]);
  });

  it('accepts a value stored as text', () => {
    const wrapper = mount(NumberStepper, {...globalConfig, props: {modelValue: '3'}});
    expect(wrapper.text()).includes('3');
  });
});
