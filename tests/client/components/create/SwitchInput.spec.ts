import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import SwitchInput from '@/client/components/create/SwitchInput.vue';

describe('SwitchInput', () => {
  it('emits the new value when toggled', async () => {
    const wrapper = mount(SwitchInput, {...globalConfig, props: {modelValue: false}});
    await wrapper.find('input').setValue(true);
    expect(wrapper.emitted('update:modelValue')?.[0]).deep.eq([true]);
  });
});
