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
});
