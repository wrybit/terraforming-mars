import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import MobileTurnButton from '@/client/components/mobile/MobileTurnButton.vue';

describe('MobileTurnButton', () => {
  it('shows the action badge while acting', () => {
    const wrapper = mount(MobileTurnButton, {props: {acting: true, actionNumber: 2, actionsPerTurn: 2}});
    expect(wrapper.classes()).to.not.include('mb-turn-button--idle');
    expect(wrapper.find('.mb-turn-count').text()).to.eq('2/2');
  });

  it('is idle without badge when another player is acting', () => {
    const wrapper = mount(MobileTurnButton, {props: {acting: false, actionNumber: undefined, actionsPerTurn: 2}});
    expect(wrapper.classes()).to.include('mb-turn-button--idle');
    expect(wrapper.find('.mb-turn-count').exists()).to.be.false;
  });
});
