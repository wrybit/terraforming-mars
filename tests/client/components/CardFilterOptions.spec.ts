import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import {reactive} from 'vue';
import CardFilterOptions from '@/client/components/cardfilter/CardFilterOptions.vue';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {emptyCardFilter} from '@/client/utils/cardFilter';
import {resetCardFilterState, unmatchedCards} from '@/client/utils/cardFilterState';

const CARDS = [CardName.ANTS, CardName.CARTEL, CardName.COMET].map((name) => ({name}) as CardModel);

describe('CardFilterOptions', () => {
  beforeEach(() => resetCardFilterState());

  function labels(wrapper: ReturnType<typeof mount>): Array<string> {
    return wrapper.findAll('.card-filter-options__label').map((label) => label.text());
  }

  it('offers the groups that occur, playable only with a context', () => {
    const filter = reactive(emptyCardFilter());
    const wrapper = mount(CardFilterOptions, {...globalConfig, props: {cards: CARDS, filter, context: {withCost: true, playable: new Set([CardName.ANTS])}}});
    expect(labels(wrapper)).to.deep.eq(['Type', 'Scoring', 'Status', 'Cost up to', 'Tags', 'Collects', 'Non-matching cards']);
  });

  it('played cards: no cost slider and no playable filter', () => {
    const filter = reactive(emptyCardFilter());
    const wrapper = mount(CardFilterOptions, {...globalConfig, props: {cards: CARDS, filter, context: {withCost: false}}});
    expect(labels(wrapper)).to.not.include('Cost up to');
    expect(labels(wrapper)).to.not.include('Status');
  });

  it('cost slider at the far right means no limit', async () => {
    const filter = reactive(emptyCardFilter());
    const wrapper = mount(CardFilterOptions, {...globalConfig, props: {cards: CARDS, filter, context: {withCost: true}}});
    const slider = wrapper.find('input[type="range"]');
    await slider.setValue('10');
    expect(filter.maxCost).eq(10);
    await slider.setValue('21');
    expect(filter.maxCost).is.undefined;
  });

  it('switches between hiding and dimming non-matching cards', async () => {
    const filter = reactive(emptyCardFilter());
    const wrapper = mount(CardFilterOptions, {...globalConfig, props: {cards: CARDS, filter, context: {withCost: true}}});
    await wrapper.findAll('.card-filter-toggle button')[1].trigger('click');
    expect(unmatchedCards.value).eq('dim');
  });
});
