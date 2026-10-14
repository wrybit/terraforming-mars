import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import AiDecisionStateFacts from '@/client/components/logpanel/aiAnalysis/AiDecisionStateFacts.vue';

describe('AiDecisionStateFacts', () => {
  it('shows stock, production and hand of the AI', () => {
    const wrapper = mount(AiDecisionStateFacts, {...globalConfig, props: {state: {
      megaCredits: 23, steel: 2, titanium: 0, plants: 5, energy: 1, heat: 4,
      production: {megacredits: 3, steel: 1, titanium: 0, plants: -1, energy: 1, heat: 2},
      terraformRating: 24, victoryPoints: 26, hand: ['Algae', 'Ants'],
    }}});
    expect(wrapper.findAll('.ai-decision-state__resource')).has.length(6);
    expect(wrapper.find('.ai-decision-state__stock').text()).eq('23');
    expect(wrapper.findAll('.ai-decision-state__card').map((card) => card.text())).deep.eq(['Algae', 'Ants']);
    expect(wrapper.text()).contains('−1');
  });

  it('lists after a pass what was still possible, without the pass itself', () => {
    const wrapper = mount(AiDecisionStateFacts, {...globalConfig, props: {passed: true, state: {
      megaCredits: 23, steel: 0, titanium: 0, plants: 0, energy: 0, heat: 0,
      production: {megacredits: 0, steel: 0, titanium: 0, plants: 0, energy: 0, heat: 0},
      terraformRating: 20, victoryPoints: 20, hand: [],
      possibleActions: [{title: 'Play project card', cards: ['Algae']}, {title: 'Pass for this generation'}],
    }}});
    const actions = wrapper.findAll('.ai-decision-state__action');
    expect(actions).has.length(1);
    expect(actions[0].text()).contains('Algae');
  });

  it('shows the production the decision changed next to the value before', () => {
    const wrapper = mount(AiDecisionStateFacts, {...globalConfig, props: {
      effects: [{resource: 'power', amount: 1, production: true}, {resource: 'megacredit', amount: -1, production: true}],
      state: {
        megaCredits: 2, steel: 0, titanium: 0, plants: 0, energy: 2, heat: 0,
        production: {megacredits: 12, steel: 0, titanium: 0, plants: 0, energy: 0, heat: 0},
        terraformRating: 20, victoryPoints: 20, hand: [],
      }}});
    const after = wrapper.findAll('.ai-decision-state__after').map((element) => element.text());
    expect(after).deep.eq(['→ +11', '→ +1']);
  });
});
