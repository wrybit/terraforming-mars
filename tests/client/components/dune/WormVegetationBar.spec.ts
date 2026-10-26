import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import WormVegetationBar from '@/client/components/dune/WormVegetationBar.vue';

describe('WormVegetationBar', () => {
  it('offers the reachable distances as buttons and emits the clicked one', async () => {
    const wrapper = mount(WormVegetationBar, {...globalConfig, props: {vegetation: 6, maximum: 14, choosable: [1, 2], chosen: 2}});
    const buttons = wrapper.findAll('button.worm-vegetation__distance');
    // 0 first: the worm may stay (Jens, 26 Oct 2026); a dashed divider between the steps
    expect(buttons.map((button) => button.text())).deep.eq(['0', '1', '2', '3']);
    expect(buttons.map((button) => button.attributes('disabled') !== undefined)).deep.eq([true, false, false, true]);
    expect(buttons[2].classes()).contains('worm-vegetation__distance--chosen');
    expect(wrapper.findAll('.worm-vegetation__divider')).has.length(3);
    await buttons[1].trigger('click');
    expect(wrapper.emitted('choose')).deep.eq([[1]]);
  });
});
