import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobilePeekHead from '@/client/components/mobile/MobilePeekHead.vue';
import {SPECTATOR_NAV} from '@/client/components/mobile/mobileScreens';

describe('MobilePeekHead', () => {
  it('marks the active screen and reports switching and closing', async () => {
    const wrapper = mount(MobilePeekHead, {...globalConfig, props: {items: SPECTATOR_NAV, active: 'players'}});
    expect(wrapper.findAll('.mb-peek-segment')).to.have.length(3);
    expect(wrapper.find('.mb-peek-segment--players').attributes('aria-selected')).to.eq('true');
    await wrapper.find('.mb-peek-segment--log').trigger('click');
    await wrapper.find('.mb-peek-close').trigger('click');
    expect(wrapper.emitted('select')).to.deep.eq([['log']]);
    expect(wrapper.emitted('close')).to.have.length(1);
  });

  it('closes when the grab strip is dragged far enough down and springs back otherwise', async () => {
    const wrapper = mount(MobilePeekHead, {...globalConfig, props: {items: SPECTATOR_NAV, active: 'mars'}});
    const element = wrapper.find('.mb-peek-grab').element;
    // jsdom has no PointerEvent: a MouseEvent with the pointer event name carries clientY
    const grab = {trigger: async (type: string, init: {clientY: number}) => {
      element.dispatchEvent(new MouseEvent(type, init));
      await wrapper.vm.$nextTick();
    }};

    await grab.trigger('pointerdown', {clientY: 100});
    await grab.trigger('pointermove', {clientY: 150});
    await grab.trigger('pointerup', {clientY: 150});
    expect(wrapper.emitted('drag')).to.deep.eq([[50], [0]]);
    expect(wrapper.emitted('close')).to.be.undefined;

    await grab.trigger('pointerdown', {clientY: 100});
    await grab.trigger('pointerup', {clientY: 260});
    expect(wrapper.emitted('close')).to.have.length(1);
  });
});
