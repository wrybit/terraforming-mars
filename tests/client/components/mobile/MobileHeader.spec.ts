import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileHeader from '@/client/components/mobile/MobileHeader.vue';
import {fakeGameModel} from '../testHelpers';

describe('MobileHeader', () => {
  it('shows generation, global parameters and the slot', () => {
    const wrapper = mount(MobileHeader, {
      ...globalConfig,
      props: {game: fakeGameModel({generation: 4, oceans: 3})},
      slots: {default: '<span class="money">42</span>'},
    });
    expect(wrapper.find('.mb-top-gen').text()).to.contain('4');
    expect(wrapper.text()).to.contain('3/9');
    expect(wrapper.find('.money').exists()).to.be.true;
  });
});
