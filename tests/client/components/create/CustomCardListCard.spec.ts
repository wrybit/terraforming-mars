import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CustomCardListCard from '@/client/components/create/CustomCardListCard.vue';
import {customListDelta, defaultCustomList} from '@/client/components/create/customCardListDefaults';
import {DEFAULT_EXPANSIONS} from '@/common/cards/GameModule';
import {CardName} from '@/common/cards/CardName';

describe('CustomCardListCard', () => {
  const expansions = {...DEFAULT_EXPANSIONS};

  it('starts in the editor without a custom list', () => {
    const wrapper = shallowMount(CustomCardListCard, {...globalConfig, props: {kind: 'corporations', title: 'title', expansions, selected: []}});
    expect((wrapper.vm as any).mode).eq('edit');
  });

  it('shows the difference to the default pool', () => {
    const selected = defaultCustomList('corporations', expansions).filter((name) => name !== CardName.CREDICOR);
    selected.push(CardName.ARIDOR);
    const wrapper = shallowMount(CustomCardListCard, {...globalConfig, props: {kind: 'corporations', title: 'title', expansions, selected}});
    expect((wrapper.vm as any).mode).eq('view');
    expect(customListDelta('corporations', expansions, selected)).deep.eq({added: [CardName.ARIDOR], removed: [CardName.CREDICOR]});
  });

  it('an empty list is the default pool', () => {
    expect(customListDelta('preludes', expansions, [])).deep.eq({added: [], removed: []});
  });
});
