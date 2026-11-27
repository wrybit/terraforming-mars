import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CardImpactBasis from '@/client/components/cardImpact/CardImpactBasis.vue';
import {Tag} from '@/common/cards/Tag';

describe('CardImpactBasis', () => {
  it('puts a divided sum in parentheses', () => {
    const wrapper = mount(CardImpactBasis, {...globalConfig, props: {basis: {type: 'count', count: {kind: 'tag', tag: Tag.BUILDING, own: 7, wild: 0, self: 1, others: false}, per: 2}}});
    expect(wrapper.text().replace(/\s+/g, '')).eq('(7+thiscard)÷2');
  });

  it('names where cities are counted and the track bonus values', () => {
    const cities = mount(CardImpactBasis, {...globalConfig, props: {basis: {type: 'count', count: {kind: 'cities', where: 'onmars', count: 5}}}});
    expect(cities.text()).contains('5').and.contains('on Mars');
    const bonus = mount(CardImpactBasis, {...globalConfig, props: {basis: {type: 'trackBonus', parameter: 'temperature', values: [-24, -20]}}});
    expect(bonus.text()).contains('-24 · -20 °C');
  });
});
