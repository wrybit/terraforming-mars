import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import MobileGlyph from '@/client/components/mobile/MobileGlyph.vue';

describe('MobileGlyph', () => {
  it('draws the outline by default', () => {
    const wrapper = mount(MobileGlyph, {props: {name: 'mars'}});
    expect(wrapper.find('.mb-glyph-line circle').exists()).to.be.true;
    expect(wrapper.find('.mb-glyph-fill').exists()).to.be.false;
  });

  it('fills the shape and separates front layers when active', () => {
    const wrapper = mount(MobileGlyph, {props: {name: 'hand', filled: true}});
    expect(wrapper.findAll('.mb-glyph-fill rect')).to.have.length(2);
    expect(wrapper.find('.mb-glyph-gap rect').exists()).to.be.true;
  });
});
