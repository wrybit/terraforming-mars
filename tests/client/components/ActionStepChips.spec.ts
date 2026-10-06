import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import ActionStepChips from '@/client/components/ActionStepChips.vue';
import {actionStep} from '@/client/components/actionStep';

describe('ActionStepChips', () => {
  it('marks the current action and the done one', () => {
    const wrapper = mount(ActionStepChips, {...globalConfig, props: {step: 2}});
    const chips = wrapper.findAll('.action-step-chip');
    expect(chips[0].classes()).includes('action-step-chip--done');
    expect(chips[1].classes()).includes('action-step-chip--now');
  });

  it('reads the step from the action menu title', () => {
    expect(actionStep({type: 'or', title: 'Take your first action', buttonLabel: '', options: []})).eq(1);
    expect(actionStep({type: 'or', title: 'Take your next action', buttonLabel: '', options: []})).eq(2);
    expect(actionStep({type: 'or', title: 'Select one option', buttonLabel: '', options: []})).is.undefined;
  });
});
