import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import SegmentedControl from '@/client/components/create/SegmentedControl.vue';
import {PLAYER_COUNT_OPTIONS} from '@/client/components/create/createGameChoices';

describe('SegmentedControl', () => {
  it('marks the current value and emits the chosen one', async () => {
    const wrapper = mount(SegmentedControl, {...globalConfig, props: {options: PLAYER_COUNT_OPTIONS, modelValue: 2}});
    const buttons = wrapper.findAll('button');
    expect(buttons[1].classes()).includes('create-game-segmented--selected');
    await buttons[3].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).deep.eq([4]);
  });
});
