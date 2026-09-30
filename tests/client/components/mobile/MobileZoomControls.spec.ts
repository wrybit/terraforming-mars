import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileZoomControls from '@/client/components/mobile/MobileZoomControls.vue';

describe('MobileZoomControls', () => {
  it('shows the level and emits zoom steps and fit', async () => {
    const wrapper = mount(MobileZoomControls, {...globalConfig, props: {percent: 140}});
    expect(wrapper.find('.mb-zoom-level').text()).to.eq('140 %');
    const buttons = wrapper.findAll('button');
    await buttons[0].trigger('click');
    await buttons[1].trigger('click');
    await buttons[2].trigger('click');
    expect(wrapper.emitted('zoom')?.map((event) => (event[0] as number) > 1)).to.deep.eq([false, true]);
    expect(wrapper.emitted('fit')).to.have.length(1);
  });
});
