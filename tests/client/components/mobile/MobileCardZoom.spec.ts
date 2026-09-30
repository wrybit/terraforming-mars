import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileCardZoom from '@/client/components/mobile/MobileCardZoom.vue';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';

describe('MobileCardZoom', () => {
  const card = {name: CardName.ANTS} as CardModel;

  it('offers playing only when the card is playable', () => {
    expect(shallowMount(MobileCardZoom, {...globalConfig, props: {card, playable: false}}).findComponent({name: 'AppButton'}).exists()).to.be.false;
    expect(shallowMount(MobileCardZoom, {...globalConfig, props: {card, playable: true}}).findComponent({name: 'AppButton'}).exists()).to.be.true;
  });

  it('closes from the backdrop (after the shrink animation, if the browser supports it)', async () => {
    const wrapper = shallowMount(MobileCardZoom, {...globalConfig, props: {card, playable: false}});
    await wrapper.find('.mb-card-zoom-backdrop').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(wrapper.emitted('close')).to.have.length(1);
  });
});
