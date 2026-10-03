import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import {reactive} from 'vue';
import CardFilterBar from '@/client/components/cardfilter/CardFilterBar.vue';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {emptyCardFilter} from '@/client/utils/cardFilter';

const CARDS = [CardName.ANTS, CardName.BIRDS, CardName.CARTEL].map((name) => ({name}) as CardModel);

function mountBar() {
  const filter = reactive(emptyCardFilter());
  const wrapper = mount(CardFilterBar, {
    ...globalConfig,
    props: {cards: CARDS, filter, context: {withCost: true}},
    slots: {sort: '<span class="sort-slot">sort</span>'},
  });
  return {wrapper, filter};
}

describe('CardFilterBar', () => {
  it('shows filter button and sort slot in one row, no count without filter', () => {
    const {wrapper} = mountBar();
    expect(wrapper.find('.card-filter-bar .card-bar-pill').exists()).is.true;
    expect(wrapper.find('.sort-slot').exists()).is.true;
    expect(wrapper.find('.card-filter-bar__count--idle').exists()).is.true;
  });

  it('opens the menu, filters by a tag and shows it as a removable chip', async () => {
    const {wrapper, filter} = mountBar();
    await wrapper.find('.card-filter-bar__filter > .card-bar-pill').trigger('click');
    expect(wrapper.find('.card-filter-menu').exists()).is.true;

    // Tags: earth (Cartel), microbe (Ants), animal (Birds)
    const tagGroup = wrapper.findAll('.card-filter-options__group').find((group) => group.text().startsWith('Tags'));
    await tagGroup!.findAll('.card-filter-chip')[0].trigger('click');
    expect([...filter.tags]).to.deep.eq(['earth']);
    expect(wrapper.find('.card-filter-bar__count').text()).eq('1/3');
    expect(wrapper.find('.card-bar-pill__badge').text()).eq('1');

    const chip = wrapper.find('.card-filter-chip--active');
    expect(chip.exists()).is.true;
    await chip.trigger('click');
    expect(filter.tags.size).eq(0);
    expect(wrapper.find('.card-filter-chip--active').exists()).is.false;
  });

  it('resets all filters from the menu', async () => {
    const {wrapper, filter} = mountBar();
    filter.victoryPoints = true;
    await wrapper.find('.card-filter-bar__filter > .card-bar-pill').trigger('click');
    await wrapper.find('.card-filter-menu__foot .card-filter-link').trigger('click');
    expect(filter.victoryPoints).is.false;
  });
});
