import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import CardListSection from '@/client/components/CardListSection.vue';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {asComplete} from './utils/models';

describe('CardListSection', () => {
  const cards = [CardName.MOSS, CardName.MINING_AREA].map((name) => asComplete<CardModel>({name, calculatedCost: 0}));

  it('shows the cards with title and count', () => {
    const wrapper = mount(CardListSection, {...globalConfig, props: {title: 'Drafted cards', cards}});
    expect(wrapper.find('.hand-cards-panel__title').text()).contains('2');
    expect(wrapper.findAll('.cardbox')).length(2);
    expect(wrapper.findAll('.card-unavailable')).length(0);
  });

  it('greys out unavailable cards', () => {
    const wrapper = mount(CardListSection, {...globalConfig, props: {title: 'Not playable', cards, unavailable: true}});
    expect(wrapper.findAll('.card-unavailable')).length(2);
  });

  it('counts only cards the filter shows and disappears when it hides all', async () => {
    const wrapper = mount(CardListSection, {...globalConfig, props: {
      title: 'Not playable', cards, visibility: (card: CardModel) => card.name === CardName.MOSS ? 'hidden' : 'shown',
    }});
    expect(wrapper.find('.hand-cards-panel__title').text()).contains('1');
    await wrapper.setProps({visibility: () => 'hidden'});
    expect(wrapper.find('.card-list-section').exists()).is.false;
  });
});
