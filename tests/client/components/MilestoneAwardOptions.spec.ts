import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import MilestoneAwardOptions from '@/client/components/MilestoneAwardOptions.vue';
import {milestoneAwardKind} from '@/client/components/milestoneAwardChoice';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';

// Vitor (Vitor.ts): free award with the name as message parameter instead of the plain title (Player.ts)
function vitorOption(award: string): PlayerInputModel {
  return {
    type: 'option',
    title: {message: 'Fund ${0} award', data: [{type: LogMessageDataType.AWARD, value: award}]},
    buttonLabel: 'Save',
  } as PlayerInputModel;
}

describe('MilestoneAwardOptions', () => {
  it('treats Vitor\'s free award as an award choice', () => {
    expect(milestoneAwardKind({type: 'or', title: 'Select award to fund'} as PlayerInputModel)).eq('awards');
  });

  it('shows the award image for message titles', () => {
    const wrapper = mount(MilestoneAwardOptions, {
      ...globalConfig,
      props: {kind: 'awards', options: [vitorOption('Celebrity'), vitorOption('Banker')], selected: undefined, groupName: 'g'},
    });
    expect(wrapper.findAll('.ma-option')).has.length(2);
    expect(wrapper.find('.ma-name--celebrity').text()).eq('Celebrity');
  });
});
