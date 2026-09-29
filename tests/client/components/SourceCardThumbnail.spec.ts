import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import SourceCardThumbnail from '@/client/components/SourceCardThumbnail.vue';
import {CardName} from '@/common/cards/CardName';

describe('SourceCardThumbnail', () => {
  it('renders the card', () => {
    const wrapper = mount(SourceCardThumbnail, {...globalConfig, props: {card: CardName.SABOTAGE}});
    expect(wrapper.find('.card-intro-card .card-container').exists()).is.true;
  });
});
