import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import AmountSlider from '@/client/components/amount/AmountSlider.vue';

describe('AmountSlider', () => {
  function slider(modelValue: number) {
    return mount(AmountSlider, {...globalConfig, props: {modelValue, min: 1, max: 5}});
  }

  it('shows the amount in the thumb and one tick per step', () => {
    const wrapper = slider(3);
    expect(wrapper.find('.amount-slider__thumb').text()).eq('3');
    expect(wrapper.findAll('.amount-slider__tick')).has.length(5);
    expect(wrapper.findAll('.amount-slider__tick--on')).has.length(3);
  });

  it('steps with −/+ and the keys, never beyond min and max', async () => {
    const wrapper = slider(5);
    const buttons = wrapper.findAllComponents({name: 'AppButton'});
    expect(buttons[1].props('disabled')).is.true;
    await buttons[0].trigger('click');
    await wrapper.find('.amount-slider').trigger('keydown', {key: 'ArrowRight'});
    expect(wrapper.emitted('update:modelValue')).deep.eq([[4]]);
  });

  it('jumps to min and max from the scale', async () => {
    const wrapper = slider(3);
    const scale = wrapper.findAll('.amount-slider-scale button');
    await scale[0].trigger('click');
    await scale[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')).deep.eq([[1], [5]]);
  });
});
