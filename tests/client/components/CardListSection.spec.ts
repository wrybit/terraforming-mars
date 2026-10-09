import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import DraftedCardsSection from '@/client/components/DraftedCardsSection.vue';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {asComplete} from './utils/models';

describe('DraftedCardsSection', () => {
  it('shows the kept cards with title and count', () => {
    const cards = [CardName.MOSS, CardName.MINING_AREA].map((name) => asComplete<CardModel>({name, calculatedCost: 0}));
    const wrapper = mount(DraftedCardsSection, {...globalConfig, props: {cards}});
    expect(wrapper.find('.hand-cards-panel__title').text()).contains('2');
    expect(wrapper.findAll('.cardbox')).length(2);
  });
});
