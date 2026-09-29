import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import CardIntroBlock from '@/client/components/CardIntroBlock.vue';
import {CardName} from '@/common/cards/CardName';

describe('CardIntroBlock', () => {
  it('shows the card name instead of a generic question', () => {
    const wrapper = mount(CardIntroBlock, {
      ...globalConfig,
      props: {card: CardName.SABOTAGE, title: 'Select one option'},
    });
    expect(wrapper.find('.card-intro-name').text()).eq('Sabotage');
    expect(wrapper.find('.card-intro-question').exists()).is.false;
  });

  it('keeps a specific question', () => {
    const wrapper = mount(CardIntroBlock, {
      ...globalConfig,
      props: {card: CardName.COMET_FOR_VENUS, title: 'Select player to remove up to 4 M€ from'},
    });
    expect(wrapper.find('.card-intro-question').text()).eq('Select player to remove up to 4 M€ from');
  });
});
