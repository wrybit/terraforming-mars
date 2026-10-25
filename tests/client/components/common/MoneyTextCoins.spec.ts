import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MoneyText from '@/client/components/common/MoneyText.vue';

describe('MoneyText coins', () => {
  it('turns the spaces beside a coin into margins, so a trimming v-i18n keeps them', () => {
    const wrapper = mount({components: {MoneyText}, template: '<p><MoneyText text="Pay 14 M€ now"/></p>'}, globalConfig);
    const coin = wrapper.find('.money-text__coin');
    expect(coin.text()).eq('14');
    expect(coin.classes()).contains('money-text__coin--after-text');
    expect(coin.classes()).contains('money-text__coin--before-text');
    expect(wrapper.text()).eq('Pay14now');
  });

  it('adds no margin where the coin touches punctuation', () => {
    const wrapper = mount({components: {MoneyText}, template: '<p><MoneyText text="Each step costs 7 M€."/></p>'}, globalConfig);
    const coin = wrapper.find('.money-text__coin');
    expect(coin.classes()).contains('money-text__coin--after-text');
    expect(coin.classes()).not.contains('money-text__coin--before-text');
  });
});
