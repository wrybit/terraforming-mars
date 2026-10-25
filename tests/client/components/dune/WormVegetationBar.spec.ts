import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import WormVegetationBar from '@/client/components/dune/WormVegetationBar.vue';

describe('WormVegetationBar', () => {
  it('offers the reachable distances as buttons and emits the clicked one', async () => {
    const wrapper = mount(WormVegetationBar, {...globalConfig, props: {vegetation: 6, maximum: 14, choosable: [1, 2], chosen: 2}});
    const buttons = wrapper.findAll('button.worm-vegetation__distance');
    expect(buttons.map((button) => button.text())).deep.eq(['1', '2', '3']);
    expect(buttons.map((button) => button.attributes('disabled') !== undefined)).deep.eq([false, false, true]);
    expect(buttons[1].classes()).contains('worm-vegetation__distance--chosen');
    await buttons[0].trigger('click');
    expect(wrapper.emitted('choose')).deep.eq([[1]]);
  });
});
