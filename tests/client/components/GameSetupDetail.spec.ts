import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import GameSetupDetail from '@/client/components/GameSetupDetail.vue';
import {fakeGameOptionsModel} from './testHelpers';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';

describe('GameSetupDetail', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(GameSetupDetail, {
      ...globalConfig,
      props: {
        playerNumber: 2,
        gameOptions: fakeGameOptionsModel(),
        lastSoloGeneration: 14,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows one tile per setting', () => {
    const wrapper = shallowMount(GameSetupDetail, {
      ...globalConfig,
      props: {
        playerNumber: 2,
        gameOptions: {...fakeGameOptionsModel(), showTimers: true},
        lastSoloGeneration: 14,
      },
    });
    const labels = wrapper.findAll('.setup-tile-label').map((label) => label.text());
    expect(labels).deep.eq(['Board', 'Expansions', 'Draft', 'Milestones and Awards', 'World Government Terraforming', 'Game configs']);
    expect(wrapper.find('.setup-chip--board-tharsis').exists()).is.true;
    expect(wrapper.find('.setup-chip--accent').text()).eq('timer');
  });

  it('shows solo settings instead of draft and milestones', () => {
    const wrapper = shallowMount(GameSetupDetail, {
      ...globalConfig,
      props: {
        playerNumber: 1,
        gameOptions: fakeGameOptionsModel(),
        lastSoloGeneration: 14,
      },
    });
    const labels = wrapper.findAll('.setup-tile-label').map((label) => label.text());
    expect(labels).deep.eq(['Board', 'Expansions', 'Solo', 'World Government Terraforming']);
  });

  it('shows manually chosen milestones and awards without the fan option', () => {
    const wrapper = shallowMount(GameSetupDetail, {
      ...globalConfig,
      props: {
        playerNumber: 2,
        gameOptions: {...fakeGameOptionsModel(), randomMA: RandomMAOptionType.MANUAL, includeFanMA: true},
        lastSoloGeneration: 14,
      },
    });
    const text = wrapper.text();
    expect(text).to.include('Manually chosen');
    expect(text).not.to.include('Include fan Milestones/Awards');
  });
});
