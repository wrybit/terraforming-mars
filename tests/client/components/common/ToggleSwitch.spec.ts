import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ToggleSwitch from '@/client/components/common/ToggleSwitch.vue';

describe('ToggleSwitch', () => {
  it('shows the state and emits the new one', async () => {
    const wrapper = mount(ToggleSwitch, {
      ...globalConfig,
      props: {modelValue: true, label: 'Label'},
    });
    const input = wrapper.find('input');
    expect((input.element as HTMLInputElement).checked).to.be.true;
    expect(wrapper.text()).to.contain('Label');
    await input.setValue(false);
    expect(wrapper.emitted('update:modelValue')?.[0]).to.deep.eq([false]);
  });

  it('works without a visible label, for a label elsewhere, and comes in a large size', async () => {
    const wrapper = mount(ToggleSwitch, {
      ...globalConfig,
      props: {modelValue: false, inputId: 'setting-x', size: 'large'},
    });
    expect(wrapper.find('.toggle-switch-label').exists()).is.false;
    expect(wrapper.find('input').attributes('id')).eq('setting-x');
    expect(wrapper.find('.toggle-switch--large').exists()).is.true;
    await wrapper.find('input').setValue(true);
    expect(wrapper.emitted('update:modelValue')?.[0]).to.deep.eq([true]);
  });
});
