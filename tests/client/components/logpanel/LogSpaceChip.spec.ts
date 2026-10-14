import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import {fakeGameModel} from '../testHelpers';
import {SpaceModel} from '@/common/models/SpaceModel';
import LogSpaceChip from '@/client/components/logpanel/LogSpaceChip.vue';

describe('LogSpaceChip', () => {
  const game = {...fakeGameModel(), spaces: [{id: '05', a9: 'C3'} as SpaceModel]};

  it('shows the board coordinate of the space', () => {
    const wrapper = mount(LogSpaceChip, {...globalConfig, props: {space: '05', game}});
    expect(wrapper.text()).eq('C3');
  });

  it('asks to highlight the space on click', async () => {
    const wrapper = mount(LogSpaceChip, {...globalConfig, props: {space: '05', game}});
    await wrapper.trigger('click');
    expect(wrapper.emitted('spaceClicked')?.[0]).deep.eq(['05']);
  });
});
