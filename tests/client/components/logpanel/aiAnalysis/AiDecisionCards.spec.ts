import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import AiDecisionCards from '@/client/components/logpanel/aiAnalysis/AiDecisionCards.vue';

describe('AiDecisionCards', () => {
  it('shows every offered card, the chosen one marked', () => {
    const wrapper = shallowMount(AiDecisionCards, {...globalConfig, props: {players: [], decision: {
      id: 'g1:1', kind: 'draft', title: 'Select a card', saveId: 1, generation: 1,
      options: [{index: 0, label: 'Algae', card: 'Algae', value: 2}, {index: 1, label: 'Ants', card: 'Ants', value: 5, chosen: true}],
    }}});
    const items = wrapper.findAll('.ai-decision-cards__item');
    expect(items).has.length(2);
    expect(items[0].classes()).contains('ai-decision-cards__item--chosen');
  });
});
