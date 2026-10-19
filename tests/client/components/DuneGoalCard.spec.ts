import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '@tests/client/components/getLocalVue';
import DuneGoalCard from '@/client/components/DuneGoalCard.vue';
import CardListDuneGoals from '@/client/components/cardlist/CardListDuneGoals.vue';

describe('DuneGoalCard', () => {
  it('shows the amount in front of the symbol, as on the mockup (35 Landsraad influence)', () => {
    const wrapper = mount(DuneGoalCard, {...globalConfig, props: {kind: 'milestones', name: 'Terraformer'}});
    expect(wrapper.find('[data-test="goal-strip"]').exists()).is.true;
    expect(wrapper.find('.dune-goal-card__count').text()).eq('35');
    expect(wrapper.findAll('.dune-goal-card__symbol')).length(1);
  });

  it('repeats the symbol instead of a number for "3 sietches"', () => {
    const wrapper = mount(DuneGoalCard, {...globalConfig, props: {kind: 'milestones', name: 'Mayor'}});
    expect(wrapper.find('.dune-goal-card__count').exists()).is.false;
    expect(wrapper.findAll('.dune-goal-card__symbol')).length(3);
  });

  it('joins spice and plasteel with a plus and names no Mars model', () => {
    const wrapper = mount(DuneGoalCard, {...globalConfig, props: {kind: 'awards', name: 'Miner'}});
    expect(wrapper.find('.dune-goal-card__plus').exists()).is.true;
    expect(wrapper.text()).not.contains('Based on');
  });

  it('falls back to the table symbol for goals without a strip', () => {
    const wrapper = mount(DuneGoalCard, {...globalConfig, props: {kind: 'milestones', name: 'Tycoon'}});
    expect(wrapper.find('[data-test="goal-strip"]').exists()).is.false;
    expect(wrapper.find('.ma-table-icon').exists()).is.true;
  });
});

describe('CardListDuneGoals', () => {
  it('lists the rules of the kind and one card per goal', () => {
    const wrapper = mount(CardListDuneGoals, {...globalConfig, props: {kind: 'awards', names: ['Landlord', 'Banker']}});
    expect(wrapper.findAll('.card-list-dune-goals__rules li')).length(4);
    expect(wrapper.findAll('.dune-goal-card--awards')).length(2);
  });
});
