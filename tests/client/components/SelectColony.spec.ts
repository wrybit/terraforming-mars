import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SelectColony from '@/client/components/SelectColony.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';

describe('SelectColony', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(SelectColony, {
      ...globalConfig,
      props: {
        playerView: {} as PlayerViewModel,
        playerinput: {
          title: 'Select a colony',
          buttonLabel: 'Save',
          type: 'colony',
          coloniesModel: [],
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows colonies as choice tiles and previews building on the board', async () => {
    const {fakePlayerViewModel} = await import('./testHelpers');
    const {colonyTradeState} = await import('@/client/components/colonies/colonyTradeState');
    const luna = {name: 'Luna', isActive: true, trackPosition: 1, colonies: ['red'], visitor: undefined} as any;
    const wrapper = shallowMount(SelectColony, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {title: 'Select where to build a colony', buttonLabel: 'Build', type: 'colony', coloniesModel: [luna]},
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.find('[data-test="colony-choice-Luna"]').text()).contains('Luna');
    await wrapper.find('[data-test="colony-choice-Luna"] input').setValue(true);
    expect(colonyTradeState.mode).eq('build');
    expect(colonyTradeState.pick).eq('Luna');
  });
});
