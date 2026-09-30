import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import MobileNavIcon from '@/client/components/mobile/MobileNavIcon.vue';

describe('MobileNavIcon', () => {
  it('draws the outline by default', () => {
    const wrapper = mount(MobileNavIcon, {props: {name: 'mars'}});
    expect(wrapper.find('.mb-nav-icon-line circle').exists()).to.be.true;
    expect(wrapper.find('.mb-nav-icon-fill').exists()).to.be.false;
  });

  it('fills the shape and separates front layers when active', () => {
    const wrapper = mount(MobileNavIcon, {props: {name: 'hand', filled: true}});
    expect(wrapper.findAll('.mb-nav-icon-fill rect')).to.have.length(2);
    expect(wrapper.find('.mb-nav-icon-gap rect').exists()).to.be.true;
  });
});
