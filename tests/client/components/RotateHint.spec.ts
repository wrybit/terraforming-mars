import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '@tests/client/components/getLocalVue';
import RotateHint from '@/client/components/RotateHint.vue';

describe('RotateHint', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(RotateHint, {...globalConfig});
    expect(wrapper.exists()).to.be.true;
  });

  it('shows phone and rotation arrow without text', () => {
    const wrapper = shallowMount(RotateHint, {...globalConfig});
    expect(wrapper.find('.rotate-hint__phone').exists()).to.be.true;
    expect(wrapper.find('.rotate-hint__arrow').exists()).to.be.true;
    expect(wrapper.text()).to.equal('');
  });
});
