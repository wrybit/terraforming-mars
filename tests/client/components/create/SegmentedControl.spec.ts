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

  it('shows a symbol instead of the label and keeps blocked options unselectable', () => {
    const options = [{value: 0, label: 'No AI', icon: 'none' as const}, {value: 1, label: '1'}, {value: 2, label: 'Seat taken', icon: 'human' as const, disabled: true}];
    const wrapper = mount(SegmentedControl, {...globalConfig, props: {options, modelValue: 0}});
    const buttons = wrapper.findAll('button');
    expect(buttons[0].find('svg').exists()).is.true;
    expect(buttons[0].attributes('aria-label')).eq('No AI');
    expect(buttons[1].text()).eq('1');
    expect(buttons[2].attributes('disabled')).is.not.undefined;
  });

  it('keeps a blocked option with a reason hoverable but never emits it', async () => {
    const options = [{value: 'ts', label: 'Classic'}, {value: 'rust', label: 'New β', disabled: true, title: 'The new AI is not available on this server'}];
    const wrapper = mount(SegmentedControl, {...globalConfig, props: {options, modelValue: 'ts'}});
    const blocked = wrapper.findAll('button')[1];
    expect(blocked.attributes('disabled')).is.undefined;
    expect(blocked.attributes('aria-disabled')).eq('true');
    expect(blocked.attributes('title')).eq('The new AI is not available on this server');
    await blocked.trigger('click');
    expect(wrapper.emitted('update:modelValue')).is.undefined;
  });
});
