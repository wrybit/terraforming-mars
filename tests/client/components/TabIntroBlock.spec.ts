import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import TabIntroBlock from '@/client/components/TabIntroBlock.vue';
import {CardName} from '@/common/cards/CardName';
import {PlayerViewModel} from '@/common/models/PlayerModel';

describe('TabIntroBlock', () => {
  const playerView = {} as PlayerViewModel;

  it('shows only the question without a card', () => {
    const wrapper = mount(TabIntroBlock, {...globalConfig, props: {intro: {hint: 'click-space'}, title: 'Select space for city tile', playerView}});
    expect(wrapper.find('.card-intro-name').exists()).is.false;
  });

  it('shows the triggering card above the question', () => {
    const wrapper = mount(TabIntroBlock, {...globalConfig, props: {intro: {hint: 'click-space'}, title: 'Select space for city tile', playerView, card: CardName.SABOTAGE}});
    expect(wrapper.find('.card-intro-name').text()).eq('Sabotage');
    expect(wrapper.find('.card-intro-card').exists()).is.true;
  });
});
