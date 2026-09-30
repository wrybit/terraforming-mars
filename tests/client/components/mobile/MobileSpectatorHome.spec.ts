import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileSpectatorHome from '@/client/components/mobile/MobileSpectatorHome.vue';
import {fakeSpectatorModel} from '../testHelpers';

describe('MobileSpectatorHome', () => {
  function mountHome() {
    return shallowMount(MobileSpectatorHome, {
      ...globalConfig,
      global: {...globalConfig.global, stubs: {...globalConfig.global.stubs, MobileNav: false}},
      props: {spectator: fakeSpectatorModel()},
    });
  }

  it('offers only Mars, players and log', () => {
    const wrapper = mountHome();
    expect(wrapper.findAll('.mb-nav-item')).to.have.length(3);
    expect(wrapper.find('.mb-nav-item--hand').exists()).to.be.false;
    expect(wrapper.find('.mb-nav-item--turn').exists()).to.be.false;
  });

  it('switches screens from the navigation', async () => {
    const wrapper = mountHome();
    await wrapper.find('.mb-nav-item--log').trigger('click');
    expect(wrapper.classes()).to.include('mb-home--log');
  });
});
