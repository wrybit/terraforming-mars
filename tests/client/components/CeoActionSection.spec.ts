import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import CeoActionSection from '@/client/components/CeoActionSection.vue';
import {CardName} from '@/common/cards/CardName';
import {SelectCardModel} from '@/common/models/PlayerInputModel';

const ceoOption = {
  type: 'card',
  title: 'Use CEO once per game action',
  buttonLabel: 'Take action',
  cards: [{name: CardName.FLOYD}],
  min: 1,
  max: 1,
} as unknown as SelectCardModel;

describe('CeoActionSection', () => {
  it('lets an offered CEO be chosen', async () => {
    const wrapper = mount(CeoActionSection, {
      ...globalConfig,
      props: {cards: [{name: CardName.FLOYD}], option: ceoOption, groupName: 'test'},
    });
    expect(wrapper.find('.ceo-action-card--available').exists()).to.be.true;
    await wrapper.find('input').setValue(true);
    expect(wrapper.emitted('select')?.[0]).deep.eq([CardName.FLOYD]);
  });

  it('marks a spent CEO as used and not selectable', () => {
    const wrapper = mount(CeoActionSection, {
      ...globalConfig,
      props: {cards: [{name: CardName.FLOYD, isDisabled: true}], groupName: 'test'},
    });
    expect(wrapper.find('.ceo-action-card--used').exists()).to.be.true;
    expect(wrapper.find('input').attributes('disabled')).to.not.be.undefined;
  });
});
