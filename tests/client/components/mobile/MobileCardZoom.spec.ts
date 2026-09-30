import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileCardZoom from '@/client/components/mobile/MobileCardZoom.vue';

describe('MobileCardZoom', () => {
  const slots = {slide: '<span class="slide-content">{{ params.index }}</span>'};

  it('offers playing only when the card is playable', () => {
    expect(shallowMount(MobileCardZoom, {...globalConfig, props: {count: 1, index: 0, playable: false}}).findComponent({name: 'AppButton'}).exists()).to.be.false;
    expect(shallowMount(MobileCardZoom, {...globalConfig, props: {count: 1, index: 0, playable: true}}).findComponent({name: 'AppButton'}).exists()).to.be.true;
  });

  it('renders one slide per card', () => {
    const wrapper = shallowMount(MobileCardZoom, {...globalConfig, props: {count: 3, index: 0}, slots});
    expect(wrapper.findAll('.slide-content').map((slide) => slide.text())).to.deep.eq(['0', '1', '2']);
  });

  it('steps to the neighbours and hides missing ones', async () => {
    const wrapper = shallowMount(MobileCardZoom, {...globalConfig, props: {count: 3, index: 0}, slots});
    const [previous, next] = wrapper.findAll('.mb-card-zoom-step');
    expect(previous.classes()).to.include('mb-card-zoom-step--hidden');
    await next.trigger('click');
    expect(wrapper.emitted('update:index')).to.deep.eq([[1]]);
  });

  it('keeps the neighbours outside on their side until the card has grown', async () => {
    const wrapper = shallowMount(MobileCardZoom, {...globalConfig, props: {count: 3, index: 1}, slots});
    expect(wrapper.classes()).to.include('mb-card-zoom--neighbors-hidden');
    const sides = wrapper.findAll('.mb-card-zoom-slide').map((slide) => slide.classes());
    expect(sides[0]).to.include('mb-card-zoom-slide--before');
    expect(sides[1]).not.to.include('mb-card-zoom-slide--before').and.not.to.include('mb-card-zoom-slide--after');
    expect(sides[2]).to.include('mb-card-zoom-slide--after');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();
    expect(wrapper.classes()).not.to.include('mb-card-zoom--neighbors-hidden');
  });

  it('closes from the backdrop (after the shrink animation, if the browser supports it)', async () => {
    const wrapper = shallowMount(MobileCardZoom, {...globalConfig, props: {count: 1, index: 0}});
    await wrapper.find('.mb-card-zoom-backdrop').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(wrapper.emitted('close')).to.have.length(1);
  });
});
