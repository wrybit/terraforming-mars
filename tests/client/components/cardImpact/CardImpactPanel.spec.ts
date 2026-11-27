import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CardImpactPanel from '@/client/components/cardImpact/CardImpactPanel.vue';
import {CardImpactLine} from '@/common/models/CardImpact';
import {Tag} from '@/common/cards/Tag';

describe('CardImpactPanel', () => {
  it('renders nothing without impact', () => {
    const wrapper = mount(CardImpactPanel, {...globalConfig, props: {impact: undefined}});
    expect(wrapper.find('.card-impact').exists()).is.false;
  });

  it('shows basis and result, production on its own area', () => {
    const impact: Array<CardImpactLine> = [{
      basis: {type: 'count', count: {kind: 'tag', tag: Tag.PLANT, own: 2, wild: 1, self: 0, others: false}},
      gains: [{resource: 'plants', amount: 3, production: true}],
    }];
    const wrapper = mount(CardImpactPanel, {...globalConfig, props: {impact}});
    expect(wrapper.findAll('.card-impact-line')).has.length(1);
    expect(wrapper.find('.card-impact-basis').text()).contains('2').and.contains('+ 1');
    expect(wrapper.find('.tag-wild').exists()).is.true;
    expect(wrapper.find('.log-effect--production').text()).eq('+3');
  });

  it('lists attack targets as player color chips with the name as tooltip', () => {
    const impact: Array<CardImpactLine> = [{
      basis: {type: 'attack', resource: 'plants', max: 8},
      gains: [],
      targets: [
        {player: {color: 'green', name: 'Green'}, amount: 5},
        {player: {color: 'blue', name: 'Blue'}, amount: 0, protected: true},
      ],
    }];
    const wrapper = mount(CardImpactPanel, {...globalConfig, props: {impact}});
    const chips = wrapper.findAll('.card-impact-target');
    expect(chips).has.length(2);
    expect(chips[0].classes()).contains('player_bg_color_green');
    expect(chips[0].attributes('title')).eq('Green');
    expect(chips[0].text()).eq('−5');
    expect(chips[1].find('.card-impact-shield').exists()).is.true;
  });
});
