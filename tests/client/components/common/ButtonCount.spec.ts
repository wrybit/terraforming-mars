import {mount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import {expect} from 'chai';
import ButtonCount from '@/client/components/common/ButtonCount.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {cardCount, resourceCountKind} from '@/client/components/common/buttonCount';
import {Resource} from '@/common/Resource';
import {CardResource} from '@/common/CardResource';

describe('ButtonCount', () => {
  it('shows a card counter as a card', () => {
    const wrapper = mount(ButtonCount, {...globalConfig, props: {part: {kind: 'card', value: 3}}});
    expect(wrapper.find('.button-count--card').text()).to.eq('3');
  });

  it('shows a resource counter as number and icon in one badge', () => {
    const wrapper = mount(ButtonCount, {...globalConfig, props: {part: {kind: 'heat', value: 2}}});
    const badge = wrapper.find('.button-count--resource.button-count--heat');
    expect(badge.find('.button-count__value').text()).to.eq('2');
    expect(badge.find('.button-count__icon').exists()).is.true;
  });

  it('puts the connecting word and the plus for income in front of the counter', () => {
    const wrapper = mount(ButtonCount, {...globalConfig, props: {part: {kind: 'megacredits', value: 2, gain: true, word: 'for'}}});
    expect(wrapper.find('.button-count__word').text()).to.eq('for');
    expect(wrapper.find('.button-count__plus').exists()).is.true;
    expect(wrapper.find('.button-count--megacredits').text()).to.eq('2');
  });

  it('counts chosen cards with their total price', () => {
    expect(cardCount(3, {perCard: 3})).to.deep.eq([
      {kind: 'card', value: 3},
      {kind: 'megacredits', value: 9, gain: undefined, word: 'for'},
    ]);
    // Free cards (beginner corporation): no price
    expect(cardCount(2, {perCard: 0})).to.deep.eq([{kind: 'card', value: 2}]);
  });

  it('knows the resources that have an icon', () => {
    expect(resourceCountKind(Resource.ENERGY)).to.eq('energy');
    expect(resourceCountKind(CardResource.MICROBE)).to.eq('microbe');
    expect(resourceCountKind(CardResource.ANIMAL)).is.undefined;
  });

  it('renders the counters inside AppButton after its text', () => {
    const wrapper = mount(AppButton, {...globalConfig, props: {title: 'Buy', counts: cardCount(1, {perCard: 3})}});
    expect(wrapper.classes()).to.include('btn-counted');
    expect(wrapper.find('.btn-counted__label').text().replace(/\s+/g, '')).to.eq('Buy1for3');
  });
});
