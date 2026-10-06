import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CardPreviewGrid from '@/client/components/create/CardPreviewGrid.vue';
import {CardName} from '@/common/cards/CardName';

describe('CardPreviewGrid', () => {
  it('renders one card per name', () => {
    const wrapper = shallowMount(CardPreviewGrid, {...globalConfig, props: {names: [CardName.ALGAE, CardName.BIRDS]}});
    expect(wrapper.findAll('.create-game-card-grid-item')).to.have.length(2);
  });

  it('marks the cards with the tone', () => {
    const wrapper = shallowMount(CardPreviewGrid, {...globalConfig, props: {names: [CardName.ALGAE], tone: 'removed'}});
    expect(wrapper.find('.create-game-card-grid-item--removed').exists()).to.be.true;
  });
});
