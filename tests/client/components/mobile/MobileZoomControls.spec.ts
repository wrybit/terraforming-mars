import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileZoomControls from '@/client/components/mobile/MobileZoomControls.vue';
import {steppedZoomRatio} from '@/client/components/mobile/mobileBoardZoom';

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

describe('steppedZoomRatio', () => {
  it('steps in 25 % from 100 % to 300 %', () => {
    expect(steppedZoomRatio(2, 1)).to.eq(2.25);
    expect(steppedZoomRatio(2, -1)).to.eq(1.75);
    expect(steppedZoomRatio(1.13, 1)).to.eq(1.25);
    expect(steppedZoomRatio(3, 1)).to.eq(3);
    expect(steppedZoomRatio(1, -1)).to.eq(1);
  });
});
