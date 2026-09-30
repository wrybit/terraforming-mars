import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileNav from '@/client/components/mobile/MobileNav.vue';
import {MOBILE_NAV, SPECTATOR_NAV} from '@/client/components/mobile/mobileScreens';

describe('MobileNav', () => {
  it('renders the spectator entries and reports navigation', async () => {
    const wrapper = mount(MobileNav, {...globalConfig, props: {items: SPECTATOR_NAV, active: 'mars'}});
    expect(wrapper.findAll('.mb-nav-item')).to.have.length(3);
    expect(wrapper.find('.mb-nav-item--mars').classes()).to.include('mb-nav-item--active');
    await wrapper.find('.mb-nav-item--log').trigger('click');
    expect(wrapper.emitted('navigate')).to.deep.eq([['log']]);
  });

  it('shows the hand badge and the turn slot', () => {
    const wrapper = mount(MobileNav, {
      ...globalConfig,
      props: {items: MOBILE_NAV, active: 'mars', handCount: 7},
      slots: {turn: '<span class="turn-button"/>'},
    });
    expect(wrapper.find('.mb-nav-badge').text()).to.eq('7');
    expect(wrapper.find('.mb-nav-item--turn .turn-button').exists()).to.be.true;
  });
});
