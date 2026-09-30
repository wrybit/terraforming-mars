import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '@tests/client/components/getLocalVue';
import RotateHint from '@/client/components/RotateHint.vue';

describe('RotateHint', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(RotateHint, {...globalConfig});
    expect(wrapper.exists()).to.be.true;
  });

  it('asks to turn the phone upright', () => {
    const wrapper = shallowMount(RotateHint, {...globalConfig});
    expect(wrapper.find('.rotate-hint__text').text()).to.contain('upright');
  });
});
