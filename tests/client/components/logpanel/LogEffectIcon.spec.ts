import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import LogEffectIcon from '@/client/components/logpanel/LogEffectIcon.vue';

describe('LogEffectIcon', () => {
  it('shows a signed amount and the resource symbol', () => {
    const wrapper = mount(LogEffectIcon, {...globalConfig, props: {effect: {resource: 'plant', amount: -2, production: true}}});
    expect(wrapper.find('b').text()).eq('−2');
    expect(wrapper.classes()).to.include('log-effect--production');
    expect(wrapper.find('.log-effect-resource--plant').exists()).to.be.true;
  });

  it('links a tile to its space', async () => {
    const wrapper = mount(LogEffectIcon, {...globalConfig, props: {effect: {tile: 'city', amount: 0, space: '05'}}});
    await wrapper.trigger('click');
    expect(wrapper.emitted('spaceClicked')?.[0]).deep.eq(['05']);
  });
});
